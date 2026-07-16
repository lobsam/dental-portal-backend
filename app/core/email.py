import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> None:
    """Send an email via SMTP.

    If SMTP credentials aren't configured (e.g. local development), the
    email is logged instead of sent so the flow can still be exercised
    without a real mail server.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info(
            "SMTP not configured -- skipping send. Would have emailed %s: %s\n%s",
            to,
            subject,
            text_body or html_body,
        )
        return

    message = EmailMessage()
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text_body or "Please view this email in an HTML-capable client.")
    message.add_alternative(html_body, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        start_tls=settings.SMTP_USE_TLS,
    )


async def send_password_reset_email(to: str, first_name: str, reset_url: str) -> None:
    subject = "Reset your Dental Portal password"
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #7a1f2b;">Password reset request</h2>
      <p>Hi {first_name},</p>
      <p>We received a request to reset your Dental Portal password. Click the button
      below to choose a new one. This link expires in
      {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
      <p style="margin: 24px 0;">
        <a href="{reset_url}"
           style="background:#7a1f2b;color:#fff;padding:12px 20px;border-radius:8px;
                  text-decoration:none;display:inline-block;">
          Reset password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email --
      your password will not be changed.</p>
      <p style="color:#888;font-size:12px;">If the button doesn't work, copy and paste this
      link into your browser:<br>{reset_url}</p>
    </div>
    """
    text_body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your Dental Portal password. "
        f"Open this link within {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes to "
        f"choose a new one:\n\n{reset_url}\n\n"
        "If you didn't request this, you can safely ignore this email."
    )
    await send_email(to, subject, html_body, text_body)
