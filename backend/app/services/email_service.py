from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


async def send_reset_email(email: EmailStr, token: str):
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    message = MessageSchema(
        subject="Password Reset — B2World AI Recruitment",
        recipients=[email],
        body=f"""
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
        """,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)


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

    message = MessageSchema(
        subject=f"Interview Scheduled — {interview_type.title()} Round | B2World",
        recipients=[email],
        body=f"""
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
        """,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_slot_selection_email(
    email: EmailStr,
    candidate_name: str,
    date: str,
    slots: list,
    selection_link: str,
    interview_type: str,
):
    slots_html = ""
    for slot in slots[:6]:  # max 6 slots show karo
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

    message = MessageSchema(
        subject=f"Select Your Interview Slot — {interview_type.title()} Round | B2World",
        recipients=[email],
        body=f"""
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
        """,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)