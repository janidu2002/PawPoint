import type { Request, Response } from "express";

import { Appointment } from "../models/Appointment";
import { Doctor, type DoctorDocument } from "../models/Doctor";
import { ApiError } from "../utils/ApiError";
import { computeAvailability, isValidDate, toIsoDate, toTimeOfDay } from "../utils/availability";
import { BLOCKING_STATUSES } from "../types/appointment";
import { WEEKDAYS } from "../types/doctor";
import type { DoctorDto, DoctorInput, Weekday } from "../types/doctor";
import { uploadDoctorImage } from "../config/cloudinary";

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
const TEXT_PATTERN = /^[\p{L}][\p{L}\d\s.,&()/'-]*$/u;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{6,19}$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

  if (name.length < 2 || !TEXT_PATTERN.test(name)) errors.name = "Use a valid text value";
  if (!specialization || !TEXT_PATTERN.test(specialization)) errors.specialization = "Use a valid text value";
  if (!qualification || !TEXT_PATTERN.test(qualification)) errors.qualification = "Use a valid text value";
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (!PHONE_PATTERN.test(phoneNumber) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phoneNumber = "Enter a valid phone number";
  }

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
 * GET /api/doctors/:id/availability?date=YYYY-MM-DD — any authenticated user.
 *
 * Resolves the doctor's weekly schedule into concrete slots for one date. Only
 * `available` is reported per slot: the client needs to know a time is taken in
 * order to grey it out, but who booked it and for which pet is nobody else's
 * business.
 */
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  // Express types `query.date` as a union that includes arrays and objects, so
  // only a bare string is a usable value.
  const rawDate =
    typeof req.query.date === "string" ? req.query.date.trim() : "";

  if (!rawDate) {
    throw ApiError.badRequest("Validation failed", {
      date: "Date is required",
    });
  }

  if (!isValidDate(rawDate)) {
    throw ApiError.badRequest("Validation failed", {
      date: "Date must be a valid date in YYYY-MM-DD format",
    });
  }

  // Both sides are UTC-derived ISO dates, so lexicographic order is chronological.
  const now = new Date();
  const today = toIsoDate(now);

  if (rawDate < today) {
    throw ApiError.badRequest("Validation failed", {
      date: "Date cannot be in the past",
    });
  }

  const booked = await Appointment.find({
    doctorId: doctor._id,
    appointmentDate: rawDate,
    status: { $in: BLOCKING_STATUSES },
  })
    .select("appointmentTime")
    .lean();

  const availability = computeAvailability({
    date: rawDate,
    startTime: doctor.startTime,
    endTime: doctor.endTime,
    availableDays: doctor.availableDays as Weekday[],
    blockedTimes: booked.map((appointment) => appointment.appointmentTime),
    // Slots that have already started today are omitted rather than marked
    // unavailable, since a picker would only ever hide them anyway.
    ...(rawDate === today ? { minStartTime: toTimeOfDay(now) } : {}),
  });

  if (!availability) {
    throw ApiError.badRequest("Validation failed", {
      date: "Date must be a valid date in YYYY-MM-DD format",
    });
  }

  res.status(200).json({
    success: true,
    message: "Availability retrieved",
    data: { doctorId: doctor._id.toString(), ...availability },
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

/** PUT /api/doctors/:id/image — accepts one validated multipart image file. */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw ApiError.badRequest("Invalid image", { image: "Choose an image to upload" });

  const bytes = file.buffer;
  const mime = file.mimetype;
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw ApiError.badRequest("Invalid image", { image: "Image must be smaller than 5 MB" });
  }

  const signatures: Record<string, boolean> = {
    "image/jpeg": bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "image/png": bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/webp": bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP",
  };
  if (!signatures[mime]) {
    throw ApiError.badRequest("Invalid image", { image: "The file contents do not match its image type" });
  }

  try {
    doctor.image = await uploadDoctorImage(bytes, doctor._id.toString());
  } catch (error) {
    console.error("Cloudinary doctor image upload failed:", error);
    throw ApiError.badRequest("Image upload failed", {
      image: "Cloudinary rejected the image. Check the Cloudinary account configuration and try again.",
    });
  }
  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Doctor image uploaded",
    data: toDoctorDto(doctor),
  });
};

/**
 * DELETE /api/doctors/:id — admin only.
 *
 * Hard delete, refused once the doctor has appointments. Deleting instead would
 * leave bookings pointing at a vet who no longer exists, and the alternative -
 * keeping the doctor - has nowhere to show up in the roster, so the admin has to
 * cancel the appointments first.
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  const [appointmentCount, blockingCount] = await Promise.all([
    Appointment.countDocuments({ doctorId: doctor._id }),
    Appointment.countDocuments({
      doctorId: doctor._id,
      status: { $in: BLOCKING_STATUSES },
    }),
  ]);

  if (appointmentCount > 0) {
    throw ApiError.conflict(
      blockingCount === appointmentCount
        ? "This doctor has upcoming appointments and cannot be deleted. Cancel them first."
        : "This doctor has appointment history and cannot be deleted"
    );
  }

  await Doctor.deleteOne({ _id: doctor._id });

  res.status(204).send();
};
