import { useState } from 'react';
import '../styles/StaffRegistrationModal.css';

const StaffRegistrationModal = ({ 
  isOpen, 
  onClose, 
  staffName, 
  email, 
  setupUrl, 
  emailSent = false 
}) => {
  const [copySuccess, setCopySuccess] = useState('');

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopySuccess('✓ Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = setupUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('✓ Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Hi ${staffName}!\n\nYour Blue Roof Lounge staff account has been created successfully!\n\nSet up your password here:\n${setupUrl}\n\nUse this email to login: ${email}\n\nLink expires in 24 hours\n\nWelcome to the team!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Welcome to Blue Roof Lounge - Set Up Your Password`;
    const body = `Hi ${staffName},

Welcome to Blue Roof Lounge!

Your staff account has been created successfully. Please set up your password to access the system:

Password Setup Link:
${setupUrl}

Login Email: ${email}

Next Steps:
1. Click the link above
2. Create a strong password (minimum 8 characters)
3. Login to the Blue Roof system

Important: This link expires in 24 hours.

If you have any questions, please contact your manager.

Best regards,
Blue Roof Lounge Team`;

    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  const handleShareSMS = () => {
    const message = `Hi ${staffName}! Your Blue Roof staff account is ready. Set up your password: ${setupUrl} (Login email: ${email}). Link expires in 24hrs.`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  return (
    <div className="modal-overlay">
      <div className="staff-modal">
        <div className="modal-header">
          <div className="success-icon"><i className="fas fa-check-circle"></i></div>
          <h2>Staff Member Registered Successfully!</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="staff-info">
            <h3><i className="fas fa-user"></i> {staffName}</h3>
            <p className="email"><i className="fas fa-envelope"></i> {email}</p>
          </div>

          {emailSent ? (
            <div className="email-status success">
              <span className="status-icon"><i className="fas fa-check-circle"></i></span>
              <p><strong>Email sent successfully!</strong> {staffName} should receive the password setup instructions shortly.</p>
            </div>
          ) : (
            <div className="email-status warning">
              <span className="status-icon"><i className="fas fa-exclamation-triangle"></i></span>
              <p><strong>Email notification failed to send automatically.</strong></p>
              <p className="manual-action"><i className="fas fa-link"></i> <strong>Manual action required:</strong> Please share the password setup link below with {staffName}.</p>
            </div>
          )}

          <div className="setup-url-section">
            <label><i className="fas fa-lock"></i> Password Setup Link:</label>
            <div className="url-container">
              <input 
                type="text" 
                value={setupUrl} 
                readOnly 
                className="setup-url-input"
              />
              <button 
                className="copy-button" 
                onClick={handleCopyLink}
                title="Copy to clipboard"
              >
                {copySuccess || <><i className="fas fa-clipboard"></i> Copy</>}
              </button>
            </div>
          </div>

          <div className="share-section">
            <h4><i className="fas fa-share"></i> Share via:</h4>
            <div className="share-buttons">
              <button className="share-btn whatsapp" onClick={handleShareWhatsApp}>
                <span className="share-icon"><i className="fab fa-whatsapp"></i></span>
                WhatsApp
              </button>
              <button className="share-btn email" onClick={handleShareEmail}>
                <span className="share-icon"><i className="fas fa-envelope"></i></span>
                Email
              </button>
              <button className="share-btn sms" onClick={handleShareSMS}>
                <span className="share-icon"><i className="fas fa-sms"></i></span>
                SMS
              </button>
            </div>
          </div>

          <div className="instructions">
            <h4><i className="fas fa-edit"></i> Instructions for {staffName}:</h4>
            <ol>
              <li>Click the password setup link</li>
              <li>Create a strong password (minimum 8 characters)</li>
              <li>Use <strong>{email}</strong> as username to login</li>
              <li>Access the Blue Roof Lounge system</li>
            </ol>
            <p className="expiry-notice"><i className="fas fa-clock"></i> <strong>Important:</strong> Link expires in 24 hours</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistrationModal;