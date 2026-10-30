# Check-in API Documentation

## POST /api/v1/checkin

### Overview
This endpoint is used by gatekeepers to perform a check-in entry scan by scanning a QR code.

### Request

**Endpoint:** `POST /api/v1/checkin`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "rawToken": "string",
  "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "requestId": "string"
}
```

### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| `rawToken` | string | The raw QR token data obtained from scanning the QR code |
| `eventId` | UUID (string) | The unique identifier of the event (format: UUID) |
| `requestId` | string | A unique identifier for this check-in request |

### Response

**Success Response:** `200 OK`

**Error Responses:**
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Missing CHECKIN_SCAN permission
- `404 Not Found` - Event or pass not found
- `409 Conflict` - Pass already used or revoked

### Validation Rules

The API performs the following validations:

1. **QR Token Validation**
   - Validates the QR token format and authenticity
   - Ensures the token is valid and not expired

2. **Pass Status Check**
   - Verifies the pass is in ACTIVATED state
   - Ensures the pass has not been revoked
   - Checks if the pass is still valid (not expired)

3. **Gatekeeper Authorization**
   - Verifies the authenticated gatekeeper is assigned to the event
   - Ensures the gatekeeper has required permissions

4. **Single-Use Check-in**
   - Records a single-use Checkin entry
   - Prevents duplicate check-ins for the same pass

### Required Permissions

- `CHECKIN_SCAN` - Required to perform check-in scans

### Use Case

**Gatekeeper Check-in Flow:**

1. Gatekeeper uses a QR code scanner to scan attendee's QR code
2. Scanner extracts the `rawToken` from the QR code
3. System retrieves the current `eventId` for the event
4. System generates a unique `requestId` for this scan
5. Gatekeeper (or system) sends POST request to `/api/v1/checkin` with the above fields
6. API validates all conditions and processes the check-in
7. Response indicates success or failure with appropriate status

### Example Request

```bash
curl -X POST https://api.example.com/api/v1/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <gatekeeper_token>" \
  -d '{
    "rawToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "requestId": "req_1234567890"
  }'
```

### Example Success Response

```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "checkinId": "chk_9876543210",
    "timestamp": "2026-10-30T15:30:00Z",
    "attendeeName": "John Doe",
    "passType": "VIP"
  }
}
```

### Example Error Response

```json
{
  "success": false,
  "message": "Pass has been revoked",
  "error": "PASS_REVOKED"
}
```
