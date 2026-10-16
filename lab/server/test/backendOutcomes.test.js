const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const models = require('../src/models');
const { issueToken } = require('../src/security/tokens');
const patientRouter = require('../src/routes/patientRoutes');
const doctorRouter = require('../src/routes/doctorRoutes');

const PATIENT_USER_ID = '000000000000000000000101';
const OTHER_USER_ID = '000000000000000000000102';
const PATIENT_ID = '000000000000000000000201';
const DOCTOR_ID = '000000000000000000000301';
const OTHER_DOCTOR_ID = '000000000000000000000302';
const ENCOUNTER_ID = '000000000000000000000401';
const SOURCE_ENCOUNTER_ID = '000000000000000000000402';
const NEW_ENCOUNTER_ID = '000000000000000000000403';
const ORDER_ID = '000000000000000000000501';
const REPORT_ID = '000000000000000000000601';
const GRANT_ID = '000000000000000000000701';
const NOTIFICATION_ID = '000000000000000000000801';

function query(value) {
  const result = {
    populate() { return result; },
    sort() { return result; },
    limit() { return result; },
    select() { return result; },
    session() { return result; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
  return result;
}

function token(subject = PATIENT_USER_ID, role = 'PATIENT') {
  return issueToken({ subject, role });
}

function startServer(t, router, configureApp = null) {
  const app = express();
  app.use(express.json());
  configureApp?.(app);
  app.use('/api/patient', router === patientRouter ? router : (_req, res, next) => next());
  if (router !== patientRouter) app.use('/api/doctor', router);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return new Promise((resolve) => server.once('listening', () => resolve({ app, server })));
}

function request(server, method, pathname, { subject = PATIENT_USER_ID, role = 'PATIENT', authenticated = true, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const headers = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
    };
    if (authenticated) headers.authorization = `Bearer ${token(subject, role)}`;
    const req = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      method,
      path: pathname,
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bytes = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        let parsed = null;
        if (contentType.includes('application/json') && bytes.length) parsed = JSON.parse(bytes.toString('utf8'));
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, bytes });
      });
    });
    req.on('error', reject);
    req.end(payload);
  });
}

function patientRecord() {
  return { _id: PATIENT_ID, user_id: PATIENT_USER_ID };
}

function doctorRecord(id = DOCTOR_ID) {
  return {
    _id: id,
    name: id === DOCTOR_ID ? 'Dr. Boundary' : 'Dr. Other',
    specialty: 'General Physician',
    clinic_name: 'Boundary Clinic',
    qr_code_id: id === DOCTOR_ID ? 'DOC-BOUNDARY' : 'DOC-OTHER',
  };
}

function encounterRecord(overrides = {}) {
  const encounter = {
    _id: ENCOUNTER_ID,
    patient_id: PATIENT_ID,
    doctor_id: DOCTOR_ID,
    visit_type: 'NEW',
    status: 'OPEN',
    queue_status: 'WAITING',
    queue_number: 1,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    started_at: null,
    ended_at: null,
    ...overrides,
  };
  encounter.save = async function save() { return this; };
  return encounter;
}

test('published report notifications are valid durable patient records', () => {
  const notification = new models.Notification({
    patient_id: PATIENT_ID,
    encounter_id: ENCOUNTER_ID,
    doctor_id: DOCTOR_ID,
    type: 'REPORT_PUBLISHED',
    title: 'CBC report published',
    message: 'Your CBC report is now available to view in your patient records.',
    visit_type: 'NEW',
    diagnostic_order_id: ORDER_ID,
    report_id: REPORT_ID,
    lab_access_grant_id: GRANT_ID,
  });

  assert.equal(notification.validateSync(), undefined);
  assert.equal(String(notification.report_id), REPORT_ID);
  assert.equal(String(notification.lab_access_grant_id), GRANT_ID);
});

test('patient notification reads include report publication notifications and read endpoints can update them', async (t) => {
  const patient = patientRecord();
  const reportNotification = {
    _id: NOTIFICATION_ID,
    patient_id: PATIENT_ID,
    encounter_id: ENCOUNTER_ID,
    diagnostic_order_id: ORDER_ID,
    report_id: REPORT_ID,
    lab_access_grant_id: GRANT_ID,
    type: 'REPORT_PUBLISHED',
    title: 'CBC report published',
    message: 'Your CBC report is now available to view in your patient records.',
    read: false,
  };
  const state = { notifications: [reportNotification], readFilter: null, readAllFilter: null };

  t.mock.method(models.Patient, 'findOne', async (filter) => (String(filter.user_id) === PATIENT_USER_ID ? patient : null));
  t.mock.method(models.Notification, 'find', () => query(state.notifications));
  t.mock.method(models.Notification, 'countDocuments', async (filter) => {
    assert.equal(filter.patient_id, PATIENT_ID);
    assert.equal(filter.read, false);
    return state.notifications.filter((item) => !item.read).length;
  });
  t.mock.method(models.Notification, 'findOneAndUpdate', async (filter) => {
    state.readFilter = filter;
    const found = state.notifications.find((item) => String(item._id) === String(filter._id) && String(item.patient_id) === String(filter.patient_id));
    if (!found) return null;
    found.read = true;
    return found;
  });
  t.mock.method(models.Notification, 'updateMany', async (filter) => {
    state.readAllFilter = filter;
    state.notifications.forEach((item) => { if (!item.read) item.read = true; });
    return { modifiedCount: 1 };
  });

  const { server } = await startServer(t, patientRouter);
  const listed = await request(server, 'GET', '/api/patient/notifications');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.notifications[0].type, 'REPORT_PUBLISHED');
  assert.equal(listed.body.notifications[0].report_id, REPORT_ID);
  assert.equal(listed.body.notifications[0].lab_access_grant_id, GRANT_ID);
  assert.equal(listed.body.unread_count, 1);

  const read = await request(server, 'POST', `/api/patient/notifications/${NOTIFICATION_ID}/read`);
  assert.equal(read.status, 200);
  assert.equal(read.body.notification.read, true);
  assert.equal(state.readFilter.type, undefined);

  const readAll = await request(server, 'POST', '/api/patient/notifications/read-all');
  assert.equal(readAll.status, 200);
  assert.equal(state.readAllFilter.type, undefined);
});

test('patient lifecycle blocks a second open consultation, supports active lookup, and ends only the owner', async (t) => {
  const patient = patientRecord();
  const doctor = doctorRecord();
  const state = {
    encounter: encounterRecord(),
    createdCount: 0,
    audioDeleted: false,
    audits: [],
  };

  t.mock.method(models.Patient, 'findOne', async (filter) => (String(filter.user_id) === PATIENT_USER_ID ? patient : null));
  t.mock.method(models.Doctor, 'findOne', async (filter) => (filter.qr_code_id === doctor.qr_code_id ? doctor : null));
  t.mock.method(models.Laboratory, 'findOne', async () => null);
  t.mock.method(models.Encounter, 'findOne', (filter) => {
    const owned = String(filter.patient_id) === PATIENT_ID;
    const open = filter.status === 'OPEN';
    const matchingId = !filter._id || String(filter._id) === String(state.encounter?._id);
    return query(owned && matchingId && (!open || state.encounter?.status === 'OPEN') ? state.encounter : null);
  });
  t.mock.method(models.Encounter, 'create', async (fields) => {
    state.createdCount += 1;
    state.encounter = encounterRecord({
      ...fields,
      _id: NEW_ENCOUNTER_ID,
      doctor_id: doctor._id,
      visit_type: fields.visit_type,
      queue_status: 'INTAKE_PENDING',
    });
    return state.encounter;
  });
  t.mock.method(models.SymptomIntake, 'updateMany', async (_filter, update) => {
    state.audioDeleted = update.$set.audio_deleted;
    return { modifiedCount: 1 };
  });
  t.mock.method(models.AuditEvent, 'create', async (event) => { state.audits.push(event); return event; });

  const { server } = await startServer(t, patientRouter);
  const active = await request(server, 'GET', '/api/patient/active-encounter');
  assert.equal(active.status, 200);
  assert.equal(active.body.encounter._id, ENCOUNTER_ID);
  assert.equal(active.body.encounter.lifecycle_state, 'WAITING');

  const blocked = await request(server, 'POST', '/api/patient/encounters', { body: { doctor_code: doctor.qr_code_id, visit_type: 'REVISITING' } });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error, 'ONGOING_CONSULTATION');
  assert.equal(blocked.body.encounter._id, ENCOUNTER_ID);
  assert.equal(state.createdCount, 0);

  const deniedEnd = await request(server, 'POST', `/api/patient/encounters/${ENCOUNTER_ID}/end`, { subject: OTHER_USER_ID });
  assert.equal(deniedEnd.status, 404);
  assert.equal(state.encounter.status, 'OPEN');

  const ended = await request(server, 'POST', `/api/patient/encounters/${ENCOUNTER_ID}/end`);
  assert.equal(ended.status, 200);
  assert.equal(ended.body.encounter.status, 'CLOSED');
  assert.equal(ended.body.encounter.lifecycle_state, 'CONSULTATION_COMPLETED');
  assert.ok(ended.body.encounter.ended_at);
  assert.equal(state.audioDeleted, true);
  assert.equal(state.audits.at(-1).actor_type, 'PATIENT');

  const empty = await request(server, 'GET', '/api/patient/active-encounter');
  assert.equal(empty.status, 200);
  assert.equal(empty.body.encounter, null);

  const started = await request(server, 'POST', '/api/patient/encounters', { body: { doctor_code: doctor.qr_code_id, visit_type: 'REVISITING' } });
  assert.equal(started.status, 201);
  assert.equal(started.body.encounter._id, NEW_ENCOUNTER_ID);
  assert.equal(started.body.encounter.lifecycle_state, 'INTAKE_PENDING');
  assert.equal(state.createdCount, 1);
});

test('doctor original report access is authenticated, revisiting-only, order-owned, and bounded', async (t) => {
  const doctor = doctorRecord();
  const patient = { ...patientRecord(), patient_identifier: 'PT-BOUNDARY' };
  const report = { _id: REPORT_ID, patient_id: PATIENT_ID, diagnostic_order_id: ORDER_ID, status: 'PUBLISHED' };
  const order = { _id: ORDER_ID, patient_id: PATIENT_ID, doctor_id: DOCTOR_ID, encounter_id: SOURCE_ENCOUNTER_ID };
  const originalFile = { report_id: REPORT_ID, original_file_name: 'published-report.pdf', storage_key: 'published-report.pdf' };
  const state = {
    encounter: encounterRecord({ visit_type: 'REVISITING', queue_status: 'IN_CONSULTATION', patient_id: patient, doctor_id: doctor }),
    sourceEncounter: { _id: SOURCE_ENCOUNTER_ID },
    report,
    order,
    originalFile,
    audits: [],
  };
  state.encounter.patient_id = patient;

  t.mock.method(models.Doctor, 'findOne', async (filter) => (String(filter.user_id) === PATIENT_USER_ID ? doctor : null));
  t.mock.method(models.Encounter, 'findOne', (filter) => {
    if (String(filter._id) === ENCOUNTER_ID) {
      return query(String(filter.doctor_id) === DOCTOR_ID ? state.encounter : null);
    }
    if (String(filter._id) === SOURCE_ENCOUNTER_ID) return query(state.sourceEncounter);
    return query(null);
  });
  t.mock.method(models.DiagnosticReport, 'findOne', async (filter) => (
    String(filter._id) === REPORT_ID && String(filter.patient_id) === PATIENT_ID && filter.status === 'PUBLISHED'
      ? state.report : null
  ));
  t.mock.method(models.DiagnosticOrder, 'findOne', async (filter) => (
    String(filter._id) === ORDER_ID && String(filter.patient_id) === PATIENT_ID && String(filter.doctor_id) === DOCTOR_ID
      ? state.order : null
  ));
  t.mock.method(models.ReportFile, 'findOne', async (filter) => (String(filter.report_id) === REPORT_ID ? state.originalFile : null));
  t.mock.method(models.AuditEvent, 'create', async (event) => { state.audits.push(event); return event; });

  const { app, server } = await startServer(t, doctorRouter, (configuredApp) => {
    configuredApp.response.download = function downloadForTest(_path, fileName) {
      this.set('content-disposition', `attachment; filename="${fileName}"`);
      this.type('application/pdf');
      this.status(200).send(Buffer.from('synthetic-pdf'));
    };
  });
  void app;

  const unauthenticated = await request(server, 'GET', `/api/doctor/encounter/${ENCOUNTER_ID}/reports/${REPORT_ID}/original`, { authenticated: false });
  assert.equal(unauthenticated.status, 401);
  const wrongRole = await request(server, 'GET', `/api/doctor/encounter/${ENCOUNTER_ID}/reports/${REPORT_ID}/original`);
  assert.equal(wrongRole.status, 403);

  state.encounter.visit_type = 'NEW';
  const newConsultation = await request(server, 'GET', `/api/doctor/encounter/${ENCOUNTER_ID}/reports/${REPORT_ID}/original`, { subject: PATIENT_USER_ID, role: 'DOCTOR' });
  assert.equal(newConsultation.status, 403);
  assert.equal(newConsultation.body.error, 'REVISITING_CONSULTATION_REQUIRED');

  state.encounter.visit_type = 'REVISITING';
  const allowed = await request(server, 'GET', `/api/doctor/encounter/${ENCOUNTER_ID}/reports/${REPORT_ID}/original`, { subject: PATIENT_USER_ID, role: 'DOCTOR' });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers['content-type'], 'application/pdf');
  assert.deepEqual(allowed.bytes, Buffer.from('synthetic-pdf'));
  assert.equal(state.audits.at(-1).action, 'DOCTOR_DOWNLOADED_PUBLISHED_REPORT_ORIGINAL');

  state.encounter.status = 'CLOSED';
  state.encounter.ended_at = new Date('2026-01-02T00:00:00.000Z');
  const closed = await request(server, 'GET', `/api/doctor/encounter/${ENCOUNTER_ID}/reports/${REPORT_ID}/original`, { subject: PATIENT_USER_ID, role: 'DOCTOR' });
  assert.equal(closed.status, 403);
  assert.equal(closed.body.error, 'BOUNDED_ACCESS_EXPIRED');
});
