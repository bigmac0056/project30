// ─────────────────────────────────────────────────────────
// Phantom Rehab — Arduino Sketch for AD8232 ECG/EMG module
//
// Wiring:
//   AD8232 GND    → Arduino GND
//   AD8232 3.3V   → Arduino 3.3V
//   AD8232 OUTPUT → Arduino A0
//   AD8232 LO-    → Arduino D11
//   AD8232 LO+    → Arduino D10
//   AD8232 SDN    → Arduino D9
//
// Output: JSON over Serial at 9600 baud, 50 Hz
//   {"ecg":512,"norm":0.5005,"v":2.500,"ms":4230,"lo":0}
//   lo=0 → electrodes OK
//   lo=1 → electrodes detached (leads-off detected)
// ─────────────────────────────────────────────────────────

const int PIN_OUTPUT = A0;   // AD8232 analog signal
const int PIN_LO_P  = 10;   // LO+ leads-off detect
const int PIN_LO_N  = 11;   // LO- leads-off detect
const int PIN_SDN   = 9;    // Shutdown (HIGH = module ON)

const int   SAMPLE_MS = 20;  // 50 Hz
const int   BAUD_RATE = 9600;

// EMG envelope — smoothed peak for norm calculation
// Adjust ALPHA for more/less smoothing (0.0–1.0)
const float ALPHA      = 0.05f;   // low = very smooth
const float ALPHA_FALL = 0.01f;   // peak envelope decay

float envelope = 0.0f;
unsigned long lastSample = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  while (!Serial) {}

  pinMode(PIN_LO_P, INPUT);
  pinMode(PIN_LO_N, INPUT);
  pinMode(PIN_SDN,  OUTPUT);

  digitalWrite(PIN_SDN, HIGH);  // Wake up AD8232 (active HIGH)

  delay(500);  // Let AD8232 settle
}

void loop() {
  unsigned long now = millis();
  if (now - lastSample < SAMPLE_MS) return;
  lastSample = now;

  // ── Leads-off detection ───────────────────────────────
  bool leadsOff = (digitalRead(PIN_LO_P) == HIGH) ||
                  (digitalRead(PIN_LO_N) == HIGH);

  if (leadsOff) {
    // Electrodes detached — send zeroed packet with lo=1
    Serial.println(F("{\"ecg\":0,\"norm\":0.0000,\"v\":0.000,\"ms\":0,\"lo\":1}"));
    envelope = 0.0f;
    return;
  }

  // ── Read AD8232 output ────────────────────────────────
  int   raw     = analogRead(PIN_OUTPUT);        // 0–1023
  float voltage = raw * (5.0f / 1023.0f);        // 0–5 V

  // ── EMG envelope (peak-hold with slow decay) ──────────
  // Gives a stable 0–1 "effort" value the games can use
  float centred = abs(raw - 512);               // distance from midpoint
  float instant = centred / 511.0f;             // 0.0–1.0 raw effort

  if (instant > envelope)
    envelope = envelope * (1.0f - ALPHA) + instant * ALPHA;
  else
    envelope *= (1.0f - ALPHA_FALL);            // slow decay

  envelope = constrain(envelope, 0.0f, 1.0f);

  // ── JSON output ───────────────────────────────────────
  Serial.print(F("{\"ecg\":"));
  Serial.print(raw);
  Serial.print(F(",\"norm\":"));
  Serial.print(envelope, 4);
  Serial.print(F(",\"v\":"));
  Serial.print(voltage, 3);
  Serial.print(F(",\"ms\":"));
  Serial.print(now);
  Serial.println(F(",\"lo\":0}"));
}
