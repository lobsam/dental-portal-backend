from datetime import datetime
from typing import Literal

from pydantic import BaseModel

PermissionLevel = Literal["none", "view", "write"]

# Grouped menu items a role's permissions can be scoped to. Mirrors the
# reference app's Role Manager screen. Each item is (key, label); the
# frontend renders one row per item with a Read/Write vs View Only choice.
MENU_GROUPS: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "My Clinic",
        [
            ("clinic_page", "Clinic Page"),
            ("profile", "Profile"),
            ("drug_lists", "Drug Lists"),
            ("procedure", "Procedure"),
            ("payment_method", "Payment Method"),
            ("patient_source", "Patient Source"),
            ("insurance", "Insurance"),
            ("appointment_request", "Appointment Request"),
        ],
    ),
    (
        "My Appointments",
        [
            ("my_appointments", "My Appointments"),
        ],
    ),
    (
        "My Patients",
        [
            ("my_patients", "My Patients"),
            ("medical_history", "Medical History"),
            ("dental_certificate", "Dental Certificate"),
            ("dental_chart", "Dental Chart"),
            ("dental_notes", "Dental Notes"),
            ("prescriptions", "Prescriptions"),
            ("appointment_schedule", "Appointment Schedule"),
            ("photos", "Photos"),
            ("payment_receipts", "Payment Receipts"),
            ("payments", "Payments"),
        ],
    ),
    (
        "Finance",
        [
            ("finance", "Finance"),
            ("expense", "Expense"),
            ("income_report", "Income Report"),
            ("patients_with_balance", "Patients With Balance"),
            ("income_report_per_insurance", "Income Report Per Insurance"),
            ("income_report_per_dentist", "Income Report Per Dentist"),
            ("installment_plan_report", "Installment Plan Report"),
            ("data_backup", "Data Backup"),
        ],
    ),
    (
        "Settings",
        [
            ("settings", "Settings"),
            ("users_list", "User's List"),
            ("role_manager", "Role Manager"),
            ("import_patient", "Import Patient"),
            ("change_password", "Change Password"),
            ("connected_device", "Connected Device"),
            ("application_settings", "Application Settings"),
            ("send_feedback", "Send Feedback"),
            ("share_to_friends", "Share to Friends"),
        ],
    ),
    (
        "Treatment Plan",
        [
            ("treatment_plan", "Treatment Plan"),
        ],
    ),
    (
        "Account",
        [
            ("account_subscription", "Account Subscription"),
        ],
    ),
    (
        "Reports",
        [
            ("reports", "Reports"),
            ("request_form", "Request Form"),
            ("user_patient_log", "User & Patient Log"),
            ("payments_report", "Payments Report"),
        ],
    ),
]

MENU_KEYS = {key for _, items in MENU_GROUPS for key, _ in items}


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permissions: dict[str, PermissionLevel] = {}


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: dict[str, PermissionLevel] | None = None


class RoleOut(BaseModel):
    id: int
    clinic_id: int
    name: str
    description: str | None
    permissions: dict[str, str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
