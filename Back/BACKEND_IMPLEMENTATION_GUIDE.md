# Backend Implementation Guide: Scale Assistant (Auxiliador de Escalas)

This document serves as a technical specification for the backend implementation in Laravel to support the "Scale Assistant" feature already implemented in the Next.js frontend.

## 1. Feature Overview
The Scale Assistant allows managers to organize employee shifts in a visual matrix. It requires automatic generation of schedules based on labor laws and manual adjustments via drag-and-drop.

## 2. Data Model (Proposed)

### `employees` table
- `id` (UUID/Primary Key)
- `name` (string)
- `role` (string)
- `department` (string)

### `shifts` table
- `id` (UUID/Primary Key)
- `name` (string) - e.g., "Manhã (08h-17h)"
- `start_time` (time)
- `end_time` (time)
- `duration_hours` (decimal)

### `scale_assignments` table (Pivot)
- `id` (UUID/Primary Key)
- `employee_id` (foreign key -> employees)
- `shift_id` (foreign key -> shifts)
- `date` (date) - The specific day the shift is assigned.

---

## 3. API Specification

All endpoints must be protected and identify the user via the `X-Clerk-User-Id` request header.

### A. Fetch Current Scale
**Endpoint:** `GET /api/escalas`
**Description:** Returns all employees, available shifts, and current assignments for the current month.
**Response Body:**
```json
{
  "employees": [
    { "id": "uuid", "name": "John Doe", "role": "Operator", "department": "Production" }
  ],
  "shifts": [
    { "id": "uuid", "name": "Morning", "start_time": "08:00", "end_time": "17:00", "duration_hours": 8 }
  ],
  "assignments": [
    { "employee_id": "uuid", "shift_id": "uuid", "date": "2026-05-14" }
  ]
}
```

### B. Generate Automatic Scale
**Endpoint:** `POST /api/escalas/gerar`
**Description:** Triggers the algorithm to automatically distribute employees into shifts based on the rules below.
**Response Body:**
```json
{ "message": "Scale generated successfully" }
```
*Note: Because this process can be heavy, consider implementing this as a Laravel Job/Queue.*

### C. Update Shift Assignment
**Endpoint:** `PATCH /api/escalas`
**Description:** Updates a specific assignment (used when a manager drags an employee to a different date/shift).
**Request Body:**
```json
{
  "employee_id": "uuid",
  "shift_id": "uuid",
  "date": "2026-05-15"
}
```
**Response Body:** The updated `ScaleAssignment` object.

### D. Export Scale to PDF
**Endpoint:** `GET /api/escalas/export/pdf`
**Description:** Generates a PDF document of the current month's scale.
**Response:** PDF binary stream / File download.

---

## 4. Business Logic & Validation Rules
The backend must enforce the following constraints during automatic generation and manual updates:

1.  **Weekly Limit**: Employees should not exceed 44 working hours per week.
2.  **Inter-shift Rest**: A minimum of 11 hours of rest is required between the end of one shift and the start of the next.
3.  **Daily Limit**: Maximum 8 hours per day (exceptions for overtime).
4.  **Sunday Off**: Every employee must have at least one Sunday off per month (to be defined/managed by the user).
5.  **Availability**: (Optional) Respect employee-marked unavailability dates.

## 5. Technical Notes for the Backend Agent
- **Authentication**: The frontend sends the user ID in the `X-Clerk-User-Id` header. Use this to scope data to the correct organization/user.
- **Response Format**: Always return JSON (except for the PDF export).
- **Error Handling**: Use standard HTTP status codes (400 for validation errors, 401 for auth, 500 for server errors).
