import type { Request, Response } from "express";
import type { Types } from "mongoose";

import { Appointment, type AppointmentDocument } from "../models/Appointment";
import { Doctor } from "../models/Doctor";
import { ApiError } from "../utils/ApiError";
import {
  computeAvailability,
  isValidDate,
  toIsoDate,
  toTimeOfDay,
} from "../utils/availability";
import {
  BLOCKING_STATUSES,
  PET_TYPES,
  STATUS_TRANSITIONS,
  type AppointmentDto,
  type AppointmentStatus,
  type DoctorSummaryDto,
  type PetType,
} from "../types/appointment";
import type { Weekday } from "../types/doctor";

/**
 * Booking writes.
 *
 * Whether a slot is bookable is never decided here: the same
 * `computeAvailability` call that powers GET /doctors/:id/availability decides
 * it for booking too, so the two endpoints cannot drift into offering a time one
 * of them will refuse.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_REASON = 1000;

/**
 * Maps an appointment to the client-facing shape.
 *
 * The only place an Appointment is converted for output, mirroring
 * toDoctorDto, so the owner-only fields cannot leak by forgetting a projection.
 */
const toAppointmentDto = (appointment: AppointmentDocument): AppointmentDto => ({
  id: appointment._id.toString(),
  userId: appointment.userId.toString(),
  doctorId: appointment.doctorId.toString(),
  petName: appointment.petName,
  petType: appointment.petType,
  petBreed: appointment.petBreed,
  appointmentDate: appointment.appointmentDate,
  appointmentTime: appointment.appointmentTime,
  reason: appointment.reason,
  status: appointment.status,
  createdAt: appointment.createdAt.toISOString(),
  updatedAt: appointment.updatedAt.toISOString(),
});

/** A lean appointment row, before the doctor is joined on. */
interface LeanAppointment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  doctorId: Types.ObjectId;
  petName: string;
  petType: PetType;
  petBreed: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lean variant of `toAppointmentDto`.
 *
 * A `.lean()` query yields plain objects rather than documents, so the hydrated
 * helper cannot be reused for reads. Both mappers exist rather than one being
 * loosened because `setStatus` depends on the hydrated shape to call `.save()`.
 */
const toAppointmentListItem = (
  appointment: LeanAppointment,
  doctor?: DoctorSummaryDto
): AppointmentDto => ({
  id: appointment._id.toString(),
  userId: appointment.userId.toString(),
  doctorId: appointment.doctorId.toString(),
  ...(doctor ? { doctor } : {}),
  petName: appointment.petName,
  petType: appointment.petType,
  petBreed: appointment.petBreed,
  appointmentDate: appointment.appointmentDate,
  appointmentTime: appointment.appointmentTime,
  reason: appointment.reason,
  status: appointment.status,
  createdAt: appointment.createdAt.toISOString(),
  updatedAt: appointment.updatedAt.toISOString(),
});

const toDoctorSummary = (doctor: {
  _id: unknown;
  name: string;
  specialization: string;
  image: string | null;
}): DoctorSummaryDto => ({
  id: String(doctor._id),
  name: doctor.name,
  specialization: doctor.specialization,
  image: doctor.image ?? null,
});

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * Validates and normalises a booking payload.
 *
 * Collects every problem first so the client can render them all at once, the
 * same approach as parseDoctorInput. Shape errors only - whether the time is
 * actually bookable needs the doctor's schedule, so that is checked after this
 * returns.
 */
const parseAppointmentInput = (body: unknown) => {
  const source: Record<string, unknown> =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const doctorId = asString(source.doctorId);
  const petName = asString(source.petName);
  const petBreed = asString(source.petBreed);
  const appointmentDate = asString(source.appointmentDate);
  const appointmentTime = asString(source.appointmentTime);
  const reason = asString(source.reason);
  const petType = asString(source.petType);

  const errors: Record<string, string> = {};

  if (!doctorId) errors.doctorId = "Doctor is required";
  if (!petName) errors.petName = "Pet name is required";
  if (!petBreed) errors.petBreed = "Pet breed is required";
  if (!reason) errors.reason = "Reason is required";
  else if (reason.length > MAX_REASON) {
    errors.reason = `Reason must be ${MAX_REASON} characters or fewer`;
  }

  if (!petType) {
    errors.petType = "Pet type is required";
  } else if (!(PET_TYPES as readonly string[]).includes(petType)) {
    errors.petType = "Choose a pet type";
  }

  if (!appointmentDate) {
    errors.appointmentDate = "Date is required";
  } else if (!isValidDate(appointmentDate)) {
    errors.appointmentDate = "Date must be a valid date in YYYY-MM-DD format";
  }

  if (!TIME_PATTERN.test(appointmentTime)) {
    errors.appointmentTime = "Time must be HH:mm";
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  return {
    doctorId,
    petName,
    petBreed,
    appointmentDate,
    appointmentTime,
    reason,
    petType: petType as AppointmentDto["petType"],
  };
};

/** POST /api/appointments — any authenticated user books for themselves. */
export const create = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw ApiError.unauthorized();
  }

  const input = parseAppointmentInput(req.body);

  const doctor = await Doctor.findById(input.doctorId);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  // Both sides are UTC-derived ISO dates, so lexicographic order is chronological.
  const now = new Date();
  const today = toIsoDate(now);

  if (input.appointmentDate < today) {
    throw ApiError.badRequest("Validation failed", {
      appointmentDate: "Date cannot be in the past",
    });
  }

  // Same cutoff the availability grid uses, so booking cannot be offered a slot
  // GET has already stopped showing.
  const availability = computeAvailability({
    date: input.appointmentDate,
    startTime: doctor.startTime,
    endTime: doctor.endTime,
    availableDays: doctor.availableDays as Weekday[],
    blockedTimes: [],
    ...(input.appointmentDate === today
      ? { minStartTime: toTimeOfDay(now) }
      : {}),
  });

  if (!availability) {
    throw ApiError.badRequest("Validation failed", {
      appointmentDate: "Date must be a valid date in YYYY-MM-DD format",
    });
  }

  // An empty grid has two causes that need different words: the vet does not
  // work that weekday at all, or it is today and every slot has already started.
  if (availability.slots.length === 0) {
    const worksThatDay = (
      doctor.availableDays as Weekday[]
    ).includes(availability.weekday);

    throw ApiError.badRequest("Validation failed", {
      appointmentDate: worksThatDay
        ? `No slots are left on ${input.appointmentDate}, the clinic day has finished`
        : `${doctor.name} does not take appointments on ${availability.weekday}s`,
    });
  }

  const slot = availability.slots.find(
    (candidate) => candidate.time === input.appointmentTime
  );

  if (!slot) {
    // Off the 15-minute grid, or outside the doctor's hours. Distinct from the
    // conflict below: no amount of retrying this exact time will help.
    throw ApiError.badRequest("Validation failed", {
      appointmentTime: `${doctor.name} is available between ${doctor.startTime} and ${doctor.endTime} on 15-minute steps`,
    });
  }

  // A time already held is a conflict rather than a bad field, so the client
  // should re-pick instead of retrying. The partial unique index is what
  // actually settles a race between two simultaneous bookings.
  if (await Appointment.exists({
    doctorId: doctor._id,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    status: { $in: BLOCKING_STATUSES },
  })) {
    throw ApiError.conflict("That time slot has just been taken");
  }

  const appointment = await Appointment.create({
    userId,
    doctorId: doctor._id,
    petName: input.petName,
    petType: input.petType,
    petBreed: input.petBreed,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    reason: input.reason,
    status: "Pending",
  });

  res.status(201).json({
    success: true,
    message: "Appointment requested",
    data: { ...toAppointmentDto(appointment), doctor: toDoctorSummary(doctor) },
  });
};

/**
 * GET /api/appointments — the caller's own bookings.
 *
 * Scoped by the JWT rather than a query parameter, so there is no way to ask for
 * somebody else's appointments. Returns the whole history unpaginated: the
 * `userId` index covers the filter and the sort, and a pet owner has a handful of
 * bookings rather than a feed.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw ApiError.unauthorized();
  }

  const appointments = (await Appointment.find({ userId })
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .lean()) as unknown as LeanAppointment[];

  // One extra query for the whole page rather than a populate per row. A booking
  // whose vet has been removed since must still render, hence the fallback.
  const doctorIds = [
    ...new Set(appointments.map((appointment) => appointment.doctorId)),
  ];

  const doctors = doctorIds.length
    ? await Doctor.find({ _id: { $in: doctorIds } }).lean()
    : [];

  const summaries = new Map<string, DoctorSummaryDto>(
    doctors.map((doctor) => [doctor._id.toString(), toDoctorSummary(doctor)])
  );

  res.status(200).json({
    success: true,
    message: "Appointments retrieved",
    data: appointments.map((appointment) =>
      toAppointmentListItem(
        appointment,
        summaries.get(appointment.doctorId.toString())
      )
    ),
  });
};

/**
 * POST /api/appointments/:id/cancel — the owner withdraws their own request.
 *
 * Pending only: the clinic confirms a booking, and from that point a cancellation
 * is the clinic's call rather than the owner's. A separate route from
 * PATCH /:id/status keeps that admin-only guarantee intact.
 *
 * Answering 404 rather than 403 for someone else's appointment matches
 * requireAdmin's reasoning - the response should not confirm which ids exist.
 */
export const cancel = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw ApiError.unauthorized();
  }

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    userId,
  });

  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  if (appointment.status !== "Pending") {
    throw ApiError.conflict(
      appointment.status === "Confirmed"
        ? "The clinic has confirmed this appointment. Please contact them to cancel it."
        : `A ${appointment.status.toLowerCase()} appointment cannot be cancelled`
    );
  }

  // Cancelling moves the appointment out of the partial unique index's filter,
  // which is what releases the slot back into the availability grid.
  appointment.status = "Cancelled";
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment cancelled",
    data: toAppointmentDto(appointment),
  });
};

/**
 * PATCH /api/appointments/:id/status — admin only.
 *
 * Owners withdraw through POST /:id/cancel; this endpoint is how the clinic
 * confirms, completes, or cancels on the owner's behalf.
 */
export const setStatus = async (req: Request, res: Response): Promise<void> => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  const status = asString((req.body as { status?: unknown } | undefined)?.status);

  if (!(status in STATUS_TRANSITIONS)) {
    throw ApiError.badRequest("Validation failed", {
      status: "Choose a valid status",
    });
  }

  const next = status as AppointmentStatus;
  const allowed = STATUS_TRANSITIONS[appointment.status];

  if (!allowed.includes(next)) {
    throw ApiError.conflict(
      allowed.length === 0
        ? `A ${appointment.status.toLowerCase()} appointment cannot be changed`
        : `A ${appointment.status.toLowerCase()} appointment can only become ${allowed.join(" or ")}`
    );
  }

  appointment.status = next;
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment updated",
    data: toAppointmentDto(appointment),
  });
};
