import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './PageHeader.css'; // Assuming this CSS file exists for styling

const PageHeader = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <header className="dashboard-header">
      <div className="pageheader-content">
        <div className="pageheader-left">
          <button
            onClick={handleGoBack}
            className="back-button"
            aria-label="Go back"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L9 13L15 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="pageheader-title">{title}</h1>
        </div>
      </div>
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string,
};

PageHeader.defaultProps = {
  title: 'Dashboard',
};

export default PageHeader;