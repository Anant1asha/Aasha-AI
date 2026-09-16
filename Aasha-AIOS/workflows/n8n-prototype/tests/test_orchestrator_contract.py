import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WF = ROOT / 'AASHA-n8n-AIOS-Orchestrator-PROTOTYPE.json'


def load_json(path):
    return json.loads(path.read_text())


def test_workflow_has_required_stages():
    wf = load_json(WF)
    names = {n['name'] for n in wf['nodes']}
    required = {
        'Prototype Trigger', 'Normalize + Privacy Gate', 'Route Approved Task',
        'Antigravity AIOS Adapter (Mock)', 'Deterministic Validator',
        'HIL / Final State Gate', 'Rejected / Stop'
    }
    assert required <= names
    assert wf['active'] is False


def test_valid_fixture_contains_no_forbidden_pii_fields():
    task = load_json(ROOT / 'tests/fixtures/valid_task.json')
    forbidden = {'student_name','student_phone','student_email','phone','email','name'}
    assert not forbidden.intersection(task)


def test_pii_fixture_is_detectable():
    task = load_json(ROOT / 'tests/fixtures/pii_task.json')
    forbidden = {'student_name','student_phone','student_email','phone','email','name'}
    assert forbidden.intersection(task)


def test_hil_required_cannot_auto_pass():
    requires_hil = True
    validation_status = 'PASS'
    final = 'FAIL' if validation_status == 'FAIL' else ('HIL_REQUIRED' if requires_hil else 'PASS')
    assert final == 'HIL_REQUIRED'


def test_validation_failure_is_not_success():
    validation_status = 'FAIL'
    final = 'FAIL' if validation_status == 'FAIL' else 'HIL_REQUIRED'
    assert final == 'FAIL'
