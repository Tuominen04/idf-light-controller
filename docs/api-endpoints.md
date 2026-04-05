# ESP32 HTTP API

All endpoints are served by the ESP32 on its local IP after WiFi setup.
Base URL: `http://<device-ip>`

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/online` | Check if device is reachable |
| `GET` | `/light` | Get current light state (`on`/`off`) |
| `PUT` | `/toggle` | Toggle light on or off |
| `GET` | `/ota/firmware-info` | Get firmware version and build info |
| `POST` | `/ota/update` | Start OTA update (body: `{ "url": "..." }`) |
| `GET` | `/ota/progress` | Poll OTA update progress |

## Response Examples

### GET /light

```json
{ "device": 1, "state": "on" }
```

### GET /ota/firmware-info

```json
{
  "version": "1.0.0",
  "project_name": "esp-light",
  "app_elf_sha256": "abc123...",
  "date": "Jan 15 2026",
  "time": "10:30:00",
  "ota_in_progress": false
}
```

### GET /ota/progress

```json
{ "in_progress": true, "progress": 45, "status": "downloading" }
```
