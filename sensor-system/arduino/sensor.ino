// ─────────────────────────────────────────────
// Phantom Rehab — Arduino Sensor Sketch
// Reads analog sensor (ECG / force / EMG)
// Sends JSON over Serial at 50 Hz
// ─────────────────────────────────────────────

const int SENSOR_PIN   = A0;      // Main analog sensor
const int SAMPLE_MS    = 20;      // 50 Hz sampling rate
const int BAUD_RATE    = 9600;

unsigned long lastSample = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  // Wait until serial port is ready (needed on Leonardo / Micro)
  while (!Serial) {}
  // Brief pause so the bridge has time to open the port
  delay(500);
}

void loop() {
  unsigned long now = millis();

  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;

    // Read raw ADC value (0–1023 on 5V Uno)
    int   raw     = analogRead(SENSOR_PIN);
    // Normalise to 0.0–1.0
    float norm    = (float)raw / 1023.0f;
    // Voltage (assuming 5 V reference)
    float voltage = norm * 5.0f;

    // ── JSON output ────────────────────────────
    // Keep it compact — bridge parses every line
    Serial.print(F("{\"ecg\":"));
    Serial.print(raw);
    Serial.print(F(",\"norm\":"));
    Serial.print(norm, 4);
    Serial.print(F(",\"v\":"));
    Serial.print(voltage, 3);
    Serial.print(F(",\"ms\":"));
    Serial.print(now);
    Serial.println(F("}"));
  }
}

// ─────────────────────────────────────────────
// MULTI-SENSOR EXAMPLE (uncomment if you have
// a second sensor on A1, e.g. accelerometer Z)
// ─────────────────────────────────────────────
//
// void loop() {
//   if (millis() - lastSample >= SAMPLE_MS) {
//     lastSample = millis();
//     int ecg = analogRead(A0);
//     int acc = analogRead(A1);
//     Serial.print(F("{\"ecg\":"));  Serial.print(ecg);
//     Serial.print(F(",\"acc\":"));  Serial.print(acc);
//     Serial.println(F("}"));
//   }
// }
