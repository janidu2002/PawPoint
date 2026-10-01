import type { Request, Response } from "express";

import { Doctor, type DoctorDocument } from "../models/Doctor";
import { ApiError } from "../utils/ApiError";
import { WEEKDAYS } from "../types/doctor";
import type { DoctorDto, DoctorInput, Weekday } from "../types/doctor";

/**
 * Maps a doctor document to the client-facing shape.
 *
 * The only place a Doctor is converted for output, mirroring toUserDto in
 * auth.controller.ts.
 */
const toDoctorDto = (doctor: DoctorDocument): DoctorDto => ({
  id: doctor._id.toString(),
  name: doctor.name,
  specialization: doctor.specialization,
  qualification: doctor.qualification,
  phoneNumber: doctor.phoneNumber,
  availableDays: doctor.availableDays as Weekday[],
  startTime: doctor.startTime,
  endTime: doctor.endTime,
  consultationFee: doctor.consultationFee,
  description: doctor.description,
  image: doctor.image ?? null,
  createdAt: doctor.createdAt.toISOString(),
  updatedAt: doctor.updatedAt.toISOString(),
});

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DESCRIPTION = 1000;

/**
 * Validates and normalises a doctor payload.
 *
 * Mirrors the hand-rolled approach in auth.controller.ts: collect every problem
 * first so the client can render them all at once, rather than revealing one per
 * round trip. The model schema enforces the same rules again at the database
 * layer, but validating here produces readable field errors instead of raw
 * Mongoose messages.
 */
const parseDoctorInput = (body: unknown): DoctorInput => {
  // `express.json()` only yields objects and arrays, but an array or a missing
  // body should still produce readable field errors rather than a crash.
  const source: Record<string, unknown> =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const name = typeof source.name === "string" ? source.name.trim() : "";
  const specialization =
    typeof source.specialization === "string" ? source.specialization.trim() : "";
  const qualification =
    typeof source.qualification === "string" ? source.qualification.trim() : "";
  const phoneNumber =
    typeof source.phoneNumber === "string" ? source.phoneNumber.trim() : "";
  const description =
    typeof source.description === "string" ? source.description.trim() : "";

  // Fee arrives as a string from a text input, so accept a numeric string.
  const rawFee = source.consultationFee;
  const consultationFee =
    typeof rawFee === "number"
      ? rawFee
      : typeof rawFee === "string" && rawFee.trim() !== ""
        ? Number(rawFee)
        : Number.NaN;

  const rawDays = Array.isArray(source.availableDays) ? source.availableDays : [];
  const availableDays = rawDays.filter(
    (day): day is Weekday =>
      typeof day === "string" && (WEEKDAYS as readonly string[]).includes(day)
  );

  const startTime = typeof source.startTime === "string" ? source.startTime.trim() : "";
  const endTime = typeof source.endTime === "string" ? source.endTime.trim() : "";

  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Name must be at least 2 characters";
  if (!specialization) errors.specialization = "Specialization is required";
  if (!qualification) errors.qualification = "Qualification is required";
  if (!phoneNumber) errors.phoneNumber = "Phone number is required";

  if (availableDays.length === 0) {
    errors.availableDays = "Select at least one available day";
  } else if (availableDays.length !== rawDays.length) {
    errors.availableDays = "Contains an unrecognised day";
  }

  if (!TIME_PATTERN.test(startTime)) {
    errors.startTime = "Start time must be HH:mm";
  }
  if (!TIME_PATTERN.test(endTime)) {
    errors.endTime = "End time must be HH:mm";
  }
  // Only comparable once both parse, which the two checks above guarantee.
  if (!errors.startTime && !errors.endTime && endTime <= startTime) {
    errors.endTime = "End time must be after the start time";
  }

  if (!Number.isFinite(consultationFee)) {
    errors.consultationFee = "Consultation fee is required";
  } else if (consultationFee < 0) {
    errors.consultationFee = "Consultation fee cannot be negative";
  }

  if (!description) errors.description = "Description is required";
  else if (description.length > MAX_DESCRIPTION) {
    errors.description = `Description must be ${MAX_DESCRIPTION} characters or fewer`;
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  const input: DoctorInput = {
    name,
    specialization,
    qualification,
    phoneNumber,
    availableDays,
    startTime,
    endTime,
    consultationFee,
    description,
  };

  // Every other field is required, so omitting one means "invalid". `image` is
  // the exception: the doctor form has no image control while uploads are out of
  // scope, so treating an absent key as null would silently erase an existing
  // image on every unrelated edit. Absent therefore means "leave alone";
  // `create` falls back to the schema default of null.
  //
  // Presence is checked with `in` rather than a type check so that an explicit
  // `image: null` still clears the image.
  if ('image' in source) {
    input.image = typeof source.image === 'string' && source.image.trim() ? source.image.trim() : null;
  }

  return input;
};

/** POST /api/doctors — admin only. */
export const create = async (_req: Request, res: Response): Promise<void> => {
  const input = parseDoctorInput(_req.body);

  const doctor = await Doctor.create(input);

  res.status(201).json({
    success: true,
    message: "Doctor created",
    data: toDoctorDto(doctor),
  });
};

/** GET /api/doctors — any authenticated user, so users can browse and select. */
export const list = async (_req: Request, res: Response): Promise<void> => {
  const doctors = await Doctor.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: "Doctors retrieved",
    data: doctors.map(toDoctorDto),
  });
};

/** GET /api/doctors/:id */
export const getById = async (req: Request, res: Response): Promise<void> => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(200).json({
    success: true,
    message: "Doctor retrieved",
    data: toDoctorDto(doctor),
  });
};

/**
 * PUT /api/doctors/:id — admin only.
 *
 * Full replacement for the editable fields: the doctor form always sends all of
 * them, so an omitted field here means the request is malformed rather than
 * "keep the old value". `image` is the exception - see `parseDoctorInput`.
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  const input = parseDoctorInput(req.body);

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(200).json({
    success: true,
    message: "Doctor updated",
    data: toDoctorDto(doctor),
  });
};

/**
 * DELETE /api/doctors/:id — admin only.
 *
 * Hard delete. Appointments do not exist yet, so there is nothing to cascade to;
 * once they reference doctors this needs a conflict check rather than leaving
 * bookings pointing at a removed doctor.
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(204).send();
};
