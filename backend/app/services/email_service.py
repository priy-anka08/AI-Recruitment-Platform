import os
import logging
import requests
from pydantic import EmailStr

logger = logging.getLogger("uvicorn.error")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
SENDER_NAME = "Sneha Mittal"
SENDER_EMAIL = "snehamittle15@gmail.com"


def _send_via_brevo(to_email: str, to_name: str, subject: str, html_content: str):
    logger.info(f"_send_via_brevo called for {to_email}")
    api_key = os.getenv("BREVO_API_KEY")
    logger.info(f"BREVO_API_KEY present: {bool(api_key)}")
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)
        logger.info(f"Brevo response status: {response.status_code}")
        if response.status_code in (200, 201):
            logger.info(f"Email sent successfully via Brevo to {to_email}")
        else:
            logger.error(f"Brevo Error: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Email Error: {e}")


async def send_reset_email(email: EmailStr, token: str):
    logger.info(f"send_reset_email CALLED for {email}")
    try:
        reset_link = f"https://ai-recruitment-platform-psi-umber.vercel.app/reset-password?token={token}"
        html = f"""
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{reset_link}" style="
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
        ">Reset Password</a>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>— B2World AI Recruitment Platform</p>
        """
        _send_via_brevo(email, None, "Password Reset — B2World AI Recruitment", html)
        logger.info(f"send_reset_email FINISHED for {email}")
    except Exception as e:
        logger.error(f"send_reset_email CRASHED: {e}")


async def send_interview_reminder(
    email: EmailStr,
    candidate_name: str,
    interview_type: str,
    scheduled_time: str,
    duration_minutes: int,
    meeting_link: str = None,
    notes: str = None
):
    meeting_section = ""
    if meeting_link:
        meeting_section = f"""
        <a href="{meeting_link}" style="
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 16px 0;
        ">🔗 Join Meeting</a>
        """

    notes_section = ""
    if notes:
        notes_section = f"""
        <div style="background: #f7f8fc; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <strong>📝 Notes:</strong><br>{notes}
        </div>
        """

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2c5364); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🤖 B2World AI Recruitment</h1>
        </div>
        <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e3a5f;">Interview Scheduled!</h2>
            <p>Dear <strong>{candidate_name}</strong>,</p>
            <p>Your interview has been scheduled. Here are the details:</p>
            <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">📋 Interview Type</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e3a5f;">{interview_type.title()} Round</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 Date & Time</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e3a5f;">{scheduled_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">⏱️ Duration</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e3a5f;">{duration_minutes} minutes</td>
                    </tr>
                </table>
            </div>
            {meeting_section}
            {notes_section}
            <p style="margin-top: 24px; color: #666; font-size: 14px;">
                Please be ready 5 minutes before the scheduled time.
            </p>
            <br>
            <p>Best of luck! 🍀</p>
            <p>— <strong>B2World AI Recruitment Team</strong></p>
        </div>
    </div>
    """
    _send_via_brevo(email, candidate_name, f"Interview Scheduled — {interview_type.title()} Round | B2World", html)


async def send_slot_selection_email(
    email: EmailStr,
    candidate_name: str,
    date: str,
    slots: list,
    selection_link: str,
    interview_type: str,
):
    slots_html = ""
    for slot in slots[:6]:
        slots_html += f"""
        <div style="
            padding: 10px 16px;
            margin: 8px 0;
            background: #f0f4ff;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            font-size: 14px;
            color: #1e3a5f;
            font-weight: 600;
        ">
            🕐 {slot['label']}
        </div>
        """

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2c5364); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🤖 B2World AI Recruitment</h1>
        </div>
        <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e3a5f;">Select Your Interview Slot</h2>
            <p>Dear <strong>{candidate_name}</strong>,</p>
            <p>You have been shortlisted for a <strong>{interview_type.title()} Round</strong> interview on <strong>{date}</strong>.</p>
            <p>Please select your preferred time slot by clicking the button below:</p>

            <div style="margin: 20px 0;">
                <p style="color: #666; font-size: 14px; margin-bottom: 12px;">Available slots on {date}:</p>
                {slots_html}
            </div>

            <a href="{selection_link}" style="
                display: inline-block;
                padding: 14px 28px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 16px 0;
            ">📅 Select My Slot</a>

            <p style="margin-top: 16px; color: #f56565; font-size: 13px;">
                ⚠️ This link will expire in <strong>48 hours</strong>. Please select your slot at the earliest.
            </p>
            <br>
            <p>Best of luck! 🍀</p>
            <p>— <strong>B2World AI Recruitment Team</strong></p>
        </div>
    </div>
    """
    _send_via_brevo(email, candidate_name, f"Select Your Interview Slot — {interview_type.title()} Round | B2World", html)


# Status-based auto emails: Rejected -> Thank you, Hold/Under Review -> Application under review,
# Shortlisted/Selected -> Moving forward
REJECTED_STATUSES = {"rejected"}
HOLD_STATUSES = {"applied", "under_review", "screened"}
ADVANCED_STATUSES = {"shortlisted", "interview_scheduled", "technical_round", "hr_round", "selected", "joined"}


async def send_application_status_email(email: EmailStr, candidate_name: str, status: str):
    status_key = (status or "").lower()

    if status_key in REJECTED_STATUSES:
        subject = "Update on Your Application | B2World"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #2c5364); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">🤖 B2World AI Recruitment</h1>
            </div>
            <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a5f;">Thank You for Applying</h2>
                <p>Dear <strong>{candidate_name}</strong>,</p>
                <p>Thank you for taking the time to apply and for your interest in joining our team.</p>
                <p>After careful review, we have decided to move forward with other candidates whose
                profile more closely matches this role at this time. This is not a reflection of your
                skills or experience.</p>
                <p>We encourage you to apply for future openings that match your profile. We wish you
                the very best in your job search.</p>
                <br>
                <p>Regards,</p>
                <p>— <strong>B2World AI Recruitment Team</strong></p>
            </div>
        </div>
        """
    elif status_key in ADVANCED_STATUSES:
        subject = "Good News — Your Application is Moving Forward | B2World"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #2c5364); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">🤖 B2World AI Recruitment</h1>
            </div>
            <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a5f;">Congratulations, {candidate_name}! 🎉</h2>
                <p>We're pleased to let you know that your application has been shortlisted and is
                moving forward in our hiring process.</p>
                <p>Our team will reach out shortly with the next steps, including interview scheduling
                details.</p>
                <br>
                <p>Best of luck! 🍀</p>
                <p>— <strong>B2World AI Recruitment Team</strong></p>
            </div>
        </div>
        """
    else:
        # Hold / under review / screened / applied — default "application under review"
        subject = "Your Application is Under Review | B2World"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #2c5364); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">🤖 B2World AI Recruitment</h1>
            </div>
            <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a5f;">Application Under Review</h2>
                <p>Dear <strong>{candidate_name}</strong>,</p>
                <p>Thank you for applying. Your application has been received and is currently
                <strong>under review</strong> by our hiring team.</p>
                <p>We will get back to you as soon as a decision has been made. No action is needed
                from your side at this time.</p>
                <br>
                <p>Regards,</p>
                <p>— <strong>B2World AI Recruitment Team</strong></p>
            </div>
        </div>
        """

    _send_via_brevo(email, candidate_name, subject, html)