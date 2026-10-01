# PawPoint Agent Guidelines

## Comments

Prefer self-explanatory code over comments.

- Add comments only when the purpose, reasoning, or behavior is not obvious from the code.
- Do not comment simple operations, assignments, function calls, or clearly named functions.
- Keep comments short and concise.
- Use single-line `//` comments.
- Explain **why** something is done rather than simply describing **what** the code does.
- Do not use comments just to separate sections of code.
- Do not use decorative comment blocks or unnecessary documentation comments.
- When modifying existing code, do not introduce unnecessary comments.
- Follow the same commenting style across frontend and backend TypeScript code.

### Good

```ts
// Prevent double-booking when concurrent requests target the same time slot
const appointment = await createAppointment(data);
```

### Avoid

```ts
// Get the doctor
const doctor = await Doctor.findById(doctorId);

// Check availability
const available = await checkAvailability(doctorId);

// Create appointment
const appointment = await Appointment.create(data);

// Return appointment
return appointment;
```

The code should remain readable primarily through clear naming, small functions, and straightforward structure rather than relying on comments.