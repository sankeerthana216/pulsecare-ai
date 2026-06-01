import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import csv

# Set page configuration
st.set_page_config(
    page_title="EduSphere Academic Analytics Portal",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Exceptions for Directory Scanner
class EmptyFolderError(Exception):
    """Custom exception raised when a scanned folder is empty."""
    pass

# Advanced Visual Redesign Styling (Emerald Green, Dark Slate, White, Gold, Blue)
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap');
    
    /* Global CSS Reset & Font Setup */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif !important;
        background-color: #F8FAFC;
        color: #334155;
    }
    .stApp {
        background-color: #F8FAFC;
    }
    
    /* Remove default Streamlit decoration header & footer */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {background-color: transparent !important;}
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: #F8FAFC;
    }
    ::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #94A3B8;
    }
    
    /* Typography Styles */
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Poppins', sans-serif !important;
        color: #0F172A !important;
        font-weight: 700 !important;
    }
    
    /* Global body paragraphs and basic text colors */
    p, span, li, label, div {
        font-family: 'Inter', sans-serif;
    }
    
    .section-header {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0F172A;
        border-bottom: 2px solid #E2E8F0;
        padding-bottom: 0.6rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    /* Modern Welcome Banner (SaaS Gradient Style) */
    .welcome-banner {
        background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
        padding: 2.5rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.15);
        position: relative;
        overflow: hidden;
    }
    .welcome-banner::after {
        content: "";
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%);
        top: -100px;
        right: -50px;
        border-radius: 50%;
    }
    .welcome-banner h1 {
        color: white !important;
        margin: 0;
        font-weight: 800;
        font-size: 2.5rem;
        letter-spacing: -0.02em;
    }
    .welcome-banner p {
        color: #F8FAFC !important;
        margin: 8px 0 0 0;
        font-size: 1.2rem;
        font-weight: 400;
    }
    
    /* Premium Metric KPI Cards */
    .kpi-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.25rem;
        margin-bottom: 2rem;
    }
    .kpi-card {
        background-color: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        border-radius: 16px !important;
        padding: 1.5rem !important;
        display: flex !important;
        align-items: center !important;
        gap: 1.25rem !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .kpi-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 10px 20px rgba(30, 58, 138, 0.08) !important;
        border-color: #2563EB !important;
    }
    .kpi-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
    }
    .icon-emerald { background-color: #ECFDF5; color: #10B981; }
    .icon-blue { background-color: #EFF6FF; color: #2563EB; }
    .icon-gold { background-color: #FFFBEB; color: #F59E0B; }
    .icon-slate { background-color: #F8FAFC; color: #64748B; }
    .kpi-details {
        flex: 1;
    }
    .kpi-label {
        font-size: 0.8rem !important;
        color: #64748B !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
    }
    .kpi-value {
        font-size: 1.85rem !important;
        color: #0F172A !important;
        font-weight: 800 !important;
        line-height: 1.2 !important;
        margin-top: 0.15rem !important;
    }
    .kpi-status {
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .status-up { color: #10B981; }
    .status-neutral { color: #2563EB; }
    .status-accent { color: #F59E0B; }
    
    /* Interactive Card Container */
    .premium-card {
        background-color: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        border-radius: 16px !important;
        padding: 1.5rem !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        margin-bottom: 1.25rem !important;
        transition: all 0.25s ease !important;
    }
    .premium-card:hover {
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08) !important;
        border-color: #CBD5E1 !important;
    }
    
    /* Recent Activity Feed */
    .activity-feed {
        margin-top: 0.5rem;
    }
    .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 0.9rem 0;
        border-bottom: 1px solid #F1F5F9;
    }
    .activity-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
    .activity-badge {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-top: 0.4rem;
        flex-shrink: 0;
    }
    .badge-dot-green { background-color: #10B981; box-shadow: 0 0 0 4px #ECFDF5; }
    .badge-dot-blue { background-color: #2563EB; box-shadow: 0 0 0 4px #EFF6FF; }
    .badge-dot-gold { background-color: #F59E0B; box-shadow: 0 0 0 4px #FFFBEB; }
    .activity-content {
        flex: 1;
        font-size: 0.92rem;
        color: #334155 !important;
        line-height: 1.4;
    }
    .activity-time {
        display: block;
        font-size: 0.78rem;
        color: #64748B !important;
        margin-top: 0.2rem;
    }
    
    /* Modern Buttons override */
    div.stButton > button {
        background-color: #1E3A8A !important;
        color: white !important;
        border: 1px solid #1E3A8A !important;
        border-radius: 10px !important;
        padding: 0.6rem 1.6rem !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.1) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        width: 100%;
        text-align: center;
    }
    div.stButton > button:hover {
        background-color: #2563EB !important;
        border-color: #2563EB !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2) !important;
    }
    div.stButton > button:active {
        transform: translateY(1px) !important;
    }
    
    /* Secondary/Action custom button indicators */
    .quick-action-header {
        font-size: 0.95rem;
        font-weight: 700;
        color: #64748B !important;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
        letter-spacing: 0.05em;
    }
    
    /* Sidebar premium redesign */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%);
        border-right: 1px solid #E2E8F0;
    }
    [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
        color: #E2E8F0;
    }
    
    /* ========================================================
       RE-ENGINEERED INPUT FIELDS & accessibility overhauls
       ======================================================== */
       
    /* Force visible labels above every single input/selectbox */
    label[data-testid="stWidgetLabel"],
    label[data-testid="stWidgetLabel"] p,
    label[data-testid="stWidgetLabel"] div,
    div[data-testid="stWidgetLabel"] p {
        color: #0F172A !important;
        font-weight: 600 !important;
        font-size: 0.92rem !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        margin-bottom: 0.35rem !important;
    }

    /* Style for ALL Streamlit text, number, area, select and multiselect controls */
    div[data-baseweb="input"], 
    div[data-baseweb="select"], 
    div[data-baseweb="textarea"],
    .stTextInput input, 
    .stNumberInput input, 
    .stTextArea textarea,
    .stSelectbox div[data-baseweb="select"],
    .stMultiSelect div[data-baseweb="select"] {
        border-radius: 10px !important;
        border: 1px solid #CBD5E1 !important; /* Proper contrast slate border */
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        font-family: 'Inter', sans-serif !important;
    }
    
    /* Direct raw fields input text values */
    div[data-baseweb="input"] input,
    div[data-baseweb="textarea"] textarea,
    .stTextInput input, 
    .stNumberInput input, 
    .stTextArea textarea {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
    }

    /* Selection items text styling inside control box */
    div[data-baseweb="select"] div[data-testid="stMarkdownContainer"] p,
    div[data-baseweb="select"] [role="button"],
    div[data-baseweb="select"] [role="button"] div {
        color: #0F172A !important;
        font-family: 'Inter', sans-serif !important;
    }

    /* High accessibility placeholder text styling */
    ::placeholder,
    input::placeholder,
    textarea::placeholder,
    .stTextInput input::placeholder,
    .stNumberInput input::placeholder,
    .stTextArea textarea::placeholder,
    div[data-baseweb="input"] input::placeholder,
    div[data-baseweb="textarea"] textarea::placeholder {
        color: #64748B !important; /* Visible gray */
        opacity: 1 !important;
        -webkit-text-fill-color: #64748B !important;
    }

    /* Selected selectbox placeholder */
    div[data-baseweb="select"] div[aria-hidden="true"],
    div[data-baseweb="select"] div:empty::before,
    div[data-baseweb="select"] div[class*="-placeholder"] {
        color: #64748B !important;
        opacity: 1 !important;
    }
    
    /* Input Fields Focus Glow Animation */
    div[data-baseweb="input"]:focus-within,
    div[data-baseweb="select"]:focus-within,
    div[data-baseweb="textarea"]:focus-within,
    .stTextInput input:focus,
    .stNumberInput input:focus,
    .stTextArea textarea:focus {
        border-color: #2563EB !important;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        outline: none !important;
    }

    /* Multiselect item tags */
    div[data-baseweb="tag"] {
        background-color: #EFF6FF !important;
        color: #1E3A8A !important;
        border: 1px solid #BFDBFE !important;
        border-radius: 6px !important;
    }
    div[data-baseweb="tag"] span {
        color: #1E3A8A !important;
    }

    /* ========================================================
       DROPDOWN SELECT PORTAL STYLING
       ======================================================== */
       
    /* Portal dropdown container menu override */
    div[data-baseweb="menu"], 
    ul[role="listbox"],
    div[role="listbox"],
    div[data-testid="stSelectbox"] div[role="listbox"] {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        border: 1px solid #CBD5E1 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
    }

    /* Dropdown elements text styling */
    div[data-baseweb="menu"] li,
    div[data-baseweb="menu"] div,
    ul[role="listbox"] li,
    ul[role="listbox"] div[role="option"],
    div[role="listbox"] div,
    div[role="option"] {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 0.88rem !important;
        padding: 8px 12px !important;
        transition: background-color 0.15s ease !important;
    }

    /* Option selection/hover highlights */
    div[data-baseweb="menu"] li:hover,
    div[data-baseweb="menu"] div:hover,
    ul[role="listbox"] li:hover,
    ul[role="listbox"] div[role="option"]:hover,
    div[role="listbox"] div:hover,
    div[role="option"]:hover,
    [aria-selected="true"] {
        background-color: #F1F5F9 !important;
        color: #0F172A !important;
        cursor: pointer !important;
    }
    
    /* ========================================================
       LIGHT THEME TABLE OVERRIDES
       ======================================================== */
       
    div[data-testid="stTable"] table {
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border-radius: 16px !important;
        overflow: hidden !important;
        border: 1px solid #E2E8F0 !important;
        width: 100% !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important;
    }
    div[data-testid="stTable"] table th {
        background-color: #F8FAFC !important;
        color: #0F172A !important;
        font-weight: 700 !important;
        font-size: 0.825rem !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        padding: 12px 16px !important;
        border-bottom: 2px solid #E2E8F0 !important;
    }
    div[data-testid="stTable"] table td {
        background-color: #FFFFFF !important;
        color: #334155 !important;
        font-size: 0.875rem !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #E2E8F0 !important;
    }
    /* Zebra alternate rows */
    div[data-testid="stTable"] table tr:nth-child(even) td {
        background-color: #F8FAFC !important;
    }
    div[data-testid="stTable"] table tr:last-child td {
        border-bottom: none !important;
    }
    div[data-testid="stTable"] table tr:hover td {
        background-color: #F1F5F9 !important;
    }
    
    /* Visual Trace Cards (Sorting/Searching) */
    .trace-block {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 0.85rem 1.15rem;
        margin-bottom: 0.6rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
    }
    .trace-block-compare {
        border-left: 5px solid #2563EB;
    }
    .trace-block-swap {
        border-left: 5px solid #10B981;
        background-color: #F0FDF4;
    }
    .trace-block-pivot {
        border-left: 5px solid #F59E0B;
        background-color: #FFFBEB;
    }
    .trace-tag {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        letter-spacing: 0.03em;
        white-space: nowrap;
    }
    .tag-blue { background-color: #EFF6FF; color: #2563EB; }
    .tag-green { background-color: #DCFCE7; color: #16A34A; }
    .tag-gold { background-color: #FEF3C7; color: #D97706; }
    .trace-msg {
        font-size: 0.88rem;
        color: #0F172A !important;
        font-weight: 500;
    }
    
    /* Podium Leaderboard Grid */
    .podium-container {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 1.5rem;
        margin: 2rem 0;
        padding: 1rem;
    }
    .podium-card {
        background-color: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        border-radius: 16px !important;
        padding: 1.5rem 1rem !important;
        text-align: center !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        width: 140px !important;
        transition: all 0.3s ease !important;
    }
    .podium-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.06) !important;
    }
    .podium-1st {
        height: 180px;
        border: 2px solid #F59E0B !important;
        position: relative;
        background: linear-gradient(180deg, #FFFFFF 0%, #FEF3C7 100%) !important;
    }
    .podium-1st::before {
        content: "👑";
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.8rem;
    }
    .podium-2nd {
        height: 145px;
        background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%) !important;
    }
    .podium-3rd {
        height: 125px;
        background: linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%) !important;
    }
    .podium-num {
        font-size: 1.85rem;
        font-weight: 800;
        margin-bottom: 0.3rem;
    }
    .podium-1st .podium-num { color: #D97706; }
    .podium-2nd .podium-num { color: #64748B !important; }
    .podium-3rd .podium-num { color: #B45309; }
    
    .podium-name-txt {
        font-weight: 700;
        color: #0F172A;
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .podium-score-txt {
        font-size: 0.8rem;
        color: #64748B !important;
        font-weight: 600;
        margin-top: 0.2rem;
    }
    
    /* Academic Assistant Chat customizations */
    .assistant-suggest-chip {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 20px;
        padding: 0.45rem 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #0F172A;
        cursor: pointer;
        display: inline-block;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
        transition: all 0.2s ease;
    }
    .assistant-suggest-chip:hover {
        background-color: #EFF6FF;
        border-color: #2563EB;
        color: #1E3A8A;
    }
    
    /* Financial Bill Card */
    .bill-invoice {
        background-color: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        border-radius: 16px !important;
        padding: 2rem !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        max-width: 500px !important;
        margin: 0 auto !important;
    }
    .invoice-header {
        border-bottom: 2px solid #F1F5F9;
        padding-bottom: 1rem;
        margin-bottom: 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .invoice-title-text {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0F172A;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .invoice-item-row {
        display: flex;
        justify-content: space-between;
        padding: 0.65rem 0;
        border-bottom: 1px dashed #E2E8F0;
        font-size: 0.95rem;
        color: #334155 !important;
    }
    .invoice-total-row {
        display: flex;
        justify-content: space-between;
        padding-top: 1.25rem;
        font-weight: 800;
        font-size: 1.35rem;
        color: #10B981;
    }
    
    /* Complete Sidebar & Collapsed Control Removal */
    [data-testid="stSidebar"] {
        display: none !important;
    }
    [data-testid="collapsedControl"] {
        display: none !important;
    }
    button[data-testid="stSidebarCollapseButton"] {
        display: none !important;
    }
    header {
        display: none !important;
    }

    /* Fixed Top Navbar Layout */
    .custom-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
        padding: 0 1.5rem;
        background-color: #FFFFFF;
        border-bottom: 1px solid #E2E8F0;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 999999;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    
    /* Logo branding */
    .navbar-logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Poppins', sans-serif;
        font-weight: 800;
        font-size: 1.15rem;
        color: #1E3A8A;
        letter-spacing: -0.02em;
        white-space: nowrap;
    }
    
    /* Menu items container */
    .navbar-menu {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-grow: 1;
        justify-content: center;
        padding: 0 1.5rem;
        overflow-x: auto;
    }
    .navbar-menu::-webkit-scrollbar {
        display: none; /* Hide scrollbars for overflow scroll */
    }
    
    /* Navbar buttons links styling */
    .menu-item {
        display: inline-flex;
        align-items: center;
        height: 36px;
        padding: 0 0.8rem;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 0.85rem;
        text-decoration: none !important;
        color: #64748B !important;
        background-color: transparent;
        border: 1px solid transparent;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
    }
    .menu-item:hover {
        background-color: #F1F5F9;
        color: #2563EB !important;
        transform: translateY(-1px);
    }
    .menu-item.active {
        background-color: #1E3A8A !important;
        color: #FFFFFF !important;
        border-color: #1E3A8A !important;
        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25) !important;
    }
    
    /* Profile user badge */
    .navbar-profile {
        display: flex;
        align-items: center;
        white-space: nowrap;
    }
    .profile-badge {
        background-color: #EFF6FF;
        color: #1E3A8A;
        padding: 0.35rem 0.85rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.8rem;
        border: 1px solid #BFDBFE;
        font-family: 'Poppins', sans-serif;
    }

    /* Padding offset for content */
    .main .block-container {
        padding-top: 80px !important;
    }
    </style>
""", unsafe_allow_html=True)

# Grade & Remark calculation helper
def calculate_grade_and_remark(marks):
    if marks >= 90:
        return "A", "Outstanding performance! Keep up the excellent work."
    elif marks >= 80:
        return "B", "Very good performance. Solid understanding of the subject."
    elif marks >= 70:
        return "C", "Good effort. There is room for improvement."
    elif marks >= 60:
        return "D", "Satisfactory. Needs more focused study."
    elif marks >= 50:
        return "E", "Pass. Needs significant improvement."
    else:
        return "F", "Fail. Please seek academic assistance immediately."

# ----------------- SESSION STATE INITIALIZATION -----------------
# 1. Load initial students data from CSV
if 'students_df' not in st.session_state:
    try:
        st.session_state.students_df = pd.read_csv("sample_data.csv")
    except Exception:
        # Fallback to default records if file is missing
        data = {
            "Student ID": ["S101", "S102", "S103", "S104", "S105"],
            "Name": ["Alice Smith", "Bob Johnson", "Charlie Brown", "Diana Prince", "Evan Wright"],
            "Subject": ["Mathematics", "Computer Science", "Physics", "Chemistry", "Mathematics"],
            "Marks": [88, 92, 74, 85, 90]
        }
        st.session_state.students_df = pd.DataFrame(data)

# Helper function to sync students_df with records_list (used for records lab)
def sync_records():
    records = []
    for _, row in st.session_state.students_df.iterrows():
        records.append({
            "ID": str(row["Student ID"]),
            "Name": str(row["Name"]),
            "Subject": str(row["Subject"]),
            "Marks": int(row["Marks"])
        })
    st.session_state.records_list = records

if 'records_list' not in st.session_state:
    sync_records()

# 2. Courses
if 'courses' not in st.session_state:
    st.session_state.courses = [
        {"Course Name": "Mathematics", "Credits": 4},
        {"Course Name": "Computer Science", "Credits": 4},
        {"Course Name": "Physics", "Credits": 3},
        {"Course Name": "Chemistry", "Credits": 3}
    ]

# 3. Chat Assistant History
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = [
        {"role": "assistant", "content": "Welcome to EduSphere Academic Assistant! Ask me any questions about GPA calculations, fee structures, registration, or attendance policies."}
    ]

# 4. Navigation Session State Handler
# ----------------- BIDIRECTIONAL PAGE SYNC -----------------
# Sync page from query parameter
if "page" in st.query_params:
    st.session_state.current_page = st.query_params["page"]

if 'current_page' not in st.session_state:
    st.session_state.current_page = "Home Dashboard"

# Update browser parameter to match session state
st.query_params["page"] = st.session_state.current_page

# ----------------- CUSTOM SAAS NAVBAR RENDER -----------------
curr_p = st.session_state.current_page
st.markdown(f"""
    <div class="custom-navbar">
        <div class="navbar-logo">
            <span class="logo-icon">🎓</span>
            <span class="logo-text">EduSphere Academic Analytics System</span>
        </div>
        <div class="navbar-menu">
            <a href="?page=Home+Dashboard" target="_self" class="menu-item {'active' if curr_p == 'Home Dashboard' else ''}">🏠 Home</a>
            <a href="?page=Student+Registration" target="_self" class="menu-item {'active' if curr_p == 'Student Registration' else ''}">👨‍🎓 Students</a>
            <a href="?page=Course+Enrollment" target="_self" class="menu-item {'active' if curr_p == 'Course Enrollment' else ''}">📚 Courses</a>
            <a href="?page=Student+Record+Management" target="_self" class="menu-item {'active' if curr_p == 'Student Record Management' else ''}">📋 Records</a>
            <a href="?page=Sorting+%26+Searching+Lab" target="_self" class="menu-item {'active' if curr_p == 'Sorting & Searching Lab' else ''}">🔍 Search & Sort</a>
            <a href="?page=Fee+Management+System" target="_self" class="menu-item {'active' if curr_p == 'Fee Management System' else ''}">💰 Fees</a>
            <a href="?page=Academic+File+Management" target="_self" class="menu-item {'active' if curr_p == 'Academic File Management' else ''}">📁 Files</a>
            <a href="?page=Directory+Scanner" target="_self" class="menu-item {'active' if curr_p == 'Directory Scanner' else ''}">🖥 Scanner</a>
            <a href="?page=Performance+Analytics" target="_self" class="menu-item {'active' if curr_p == 'Performance Analytics' else ''}">📊 Analytics</a>
            <a href="?page=Academic+Assistant" target="_self" class="menu-item {'active' if curr_p == 'Academic Assistant' else ''}">🤖 Assistant</a>
        </div>
        <div class="navbar-profile">
            <span class="profile-badge">👤 Administrator</span>
        </div>
    </div>
""", unsafe_allow_html=True)


# ----------------- MODULE 1: HOME DASHBOARD REDESIGN -----------------
if st.session_state.current_page == "Home Dashboard":
    st.markdown("""
        <div class='welcome-banner'>
            <h1>Welcome Back, Administrator</h1>
            <p>Here is your general overview of EduSphere's academic logs, registries, analytics, and operational metrics.</p>
        </div>
    """, unsafe_allow_html=True)
    
    # Calculate Metrics
    df = st.session_state.students_df
    total_students = len(df)
    total_courses = len(st.session_state.courses)
    avg_marks = df["Marks"].mean() if total_students > 0 else 0.0
    
    top_student_name = "N/A"
    top_student_marks = 0
    if total_students > 0:
        top_idx = df["Marks"].idxmax()
        top_student_name = df.loc[top_idx, "Name"]
        top_student_marks = df.loc[top_idx, "Marks"]

    # Redesigned KPI cards structure
    st.markdown(f"""
        <div class="kpi-container">
            <div class="kpi-card">
                <div class="kpi-icon-box icon-emerald">👤</div>
                <div class="kpi-details">
                    <div class="kpi-label">Total Registry</div>
                    <div class="kpi-value">{total_students}</div>
                    <div class="kpi-status status-up">↑ 12% this term</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-box icon-blue">📚</div>
                <div class="kpi-details">
                    <div class="kpi-label">Active Courses</div>
                    <div class="kpi-value">{total_courses}</div>
                    <div class="kpi-status status-neutral">4 core curricula</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-box icon-gold">📈</div>
                <div class="kpi-details">
                    <div class="kpi-label">Average Score</div>
                    <div class="kpi-value">{avg_marks:.1f}</div>
                    <div class="kpi-status status-accent">Class Average</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-box icon-slate">🏆</div>
                <div class="kpi-details">
                    <div class="kpi-label">Top Performer</div>
                    <div class="kpi-value">{top_student_name.split()[0] if total_students > 0 else "N/A"}</div>
                    <div class="kpi-status status-up">{top_student_marks} Marks</div>
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    left_col, right_col = st.columns([1.8, 1.2])
    
    with left_col:
        st.markdown("""
            <div class="premium-card" style="height: 100%;">
                <h3 style="margin-top: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">📁 Quick Registry Catalog</h3>
                <p style="color: #64748B; font-size: 0.88rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Standard database tracking table representing all current active profiles.</p>
            </div>
        """, unsafe_allow_html=True)
        # Wrap dataframe display next to container
        st.dataframe(df, use_container_width=True, hide_index=True)
        
    with right_col:
        # Quick actions
        st.write("<div class='quick-action-header'>Quick Action Shortcuts</div>", unsafe_allow_html=True)
        col_act1, col_act2 = st.columns(2)
        with col_act1:
            if st.button("➕ Register Student"):
                st.session_state.current_page = "Student Registration"
                st.rerun()
            if st.button("📈 Run Analytics"):
                st.session_state.current_page = "Performance Analytics"
                st.rerun()
        with col_act2:
            if st.button("📚 Add Course"):
                st.session_state.current_page = "Course Enrollment"
                st.rerun()
            if st.button("💬 Ask Assistant"):
                st.session_state.current_page = "Academic Assistant"
                st.rerun()
                
        # Recent activity log cards
        st.markdown("""
            <div class="premium-card" style="margin-top: 1.5rem;">
                <h3 style="margin-top: 0; font-size: 1.25rem;">🔔 System Activity Feed</h3>
                <div class="activity-feed">
                    <div class="activity-item">
                        <div class="activity-badge badge-dot-green"></div>
                        <div class="activity-content">
                            New student profile registered under ID <strong>S110 Julia Roberts</strong>.
                            <span class="activity-time">3 minutes ago</span>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-badge badge-dot-blue"></div>
                        <div class="activity-content">
                            Updated academic credits structure inside <strong>Course Enrollment</strong>.
                            <span class="activity-time">1 hour ago</span>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-badge badge-dot-gold"></div>
                        <div class="activity-content">
                            Generated local text reports backup file: <strong>academic_summary.txt</strong>.
                            <span class="activity-time">Yesterday</span>
                        </div>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)


# ----------------- MODULE 2: STUDENT REGISTRATION REDESIGN -----------------
elif st.session_state.current_page == "Student Registration":
    st.markdown("<h2 class='section-header'>👤 Student Registration Desk</h2>", unsafe_allow_html=True)
    
    col_form, col_preview = st.columns([1.3, 1.7])
    
    with col_form:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Official Registration Form</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Fill out student credentials to calculate grade & log record.</p>
            </div>
        """, unsafe_allow_html=True)
        
        with st.form("registration_form", clear_on_submit=True):
            student_name = st.text_input("Full Name", placeholder="e.g. John Doe")
            student_id = st.text_input("Student ID (Unique ID)", placeholder="e.g. S111")
            
            # List of subjects available in current system
            available_subjects = sorted(list(set([c["Course Name"] for c in st.session_state.courses])))
            if not available_subjects:
                available_subjects = ["Mathematics", "Computer Science", "Physics", "Chemistry"]
            subject = st.selectbox("Assign Subject Course", available_subjects)
            
            marks = st.number_input("Exam Score Marks (0-100)", min_value=0, max_value=100, value=75, step=1)
            submit_reg = st.form_submit_button("Register & Finalize Grade")
            
            if submit_reg:
                if not student_name.strip() or not student_id.strip():
                    st.error("Missing inputs: Name and ID cannot be left empty.")
                elif student_id in st.session_state.students_df["Student ID"].astype(str).values:
                    st.error(f"Integrity Error: Student ID '{student_id}' is already registered.")
                else:
                    grade, remark = calculate_grade_and_remark(marks)
                    new_row = pd.DataFrame([{
                        "Student ID": student_id.strip(),
                        "Name": student_name.strip(),
                        "Subject": subject,
                        "Marks": int(marks)
                    }])
                    st.session_state.students_df = pd.concat([st.session_state.students_df, new_row], ignore_index=True)
                    sync_records()
                    st.success(f"Success! {student_name} has been enrolled in {subject}.")

    with col_preview:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Interactive Real-Time Grade Preview Sandbox</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Adjust the slider values to preview calculations in real time.</p>
            </div>
        """, unsafe_allow_html=True)
        
        # Sandbox parameters (Outside of form, so it re-runs on change!)
        preview_marks = st.slider("Select Mock Score for Preview", 0, 100, 75)
        p_grade, p_remark = calculate_grade_and_remark(preview_marks)
        
        # Visual color for grade card
        color_map = {"A": "#10B981", "B": "#2563EB", "C": "#1E3A8A", "D": "#F59E0B", "E": "#8B5CF6", "F": "#EF4444"}
        grade_color = color_map.get(p_grade, "#10B981")
        
        st.markdown(f"""
            <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; border-left: 6px solid {grade_color}; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
                <div style='background-color: {grade_color}15; color: {grade_color}; width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; border: 1px solid {grade_color}30;'>
                    {p_grade}
                </div>
                <div>
                    <h4 style='margin: 0; font-size: 1.1rem; color: #0F172A;'>Calculated Grade Standing</h4>
                    <p style='margin: 4px 0 0 0; font-size: 0.92rem; color: #475569; font-weight: 500;'>"{p_remark}"</p>
                </div>
            </div>
        """, unsafe_allow_html=True)

        st.write("#### Active Student Records Catalog")
        # Visual upgrade for directory tables: dynamic calculations columns
        table_df = st.session_state.students_df.copy()
        t_grades = []
        t_remarks = []
        for index, row in table_df.iterrows():
            g, r = calculate_grade_and_remark(row["Marks"])
            t_grades.append(g)
            t_remarks.append(r)
        table_df["Grade"] = t_grades
        table_df["Remark"] = t_remarks
        
        st.dataframe(table_df, use_container_width=True, hide_index=True)


# ----------------- MODULE 3: COURSE ENROLLMENT REDESIGN -----------------
elif st.session_state.current_page == "Course Enrollment":
    st.markdown("<h2 class='section-header'>📚 Curriculum Course Enrollment</h2>", unsafe_allow_html=True)
    
    col_enroll, col_catalog = st.columns([1.2, 1.8])
    
    with col_enroll:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Course Registrar Form</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Add course offerings directly into the active syllabus structure.</p>
            </div>
        """, unsafe_allow_html=True)
        
        with st.form("course_form", clear_on_submit=True):
            course_name = st.text_input("New Course Title", placeholder="e.g. Biology")
            credits = st.number_input("Curriculum Credits Hours", min_value=1, max_value=6, value=3, step=1)
            submit_course = st.form_submit_button("Enroll Course into Syllabus")
            
            if submit_course:
                if not course_name.strip():
                    st.error("Validation failed: Course name cannot be empty.")
                elif any(c["Course Name"].lower() == course_name.strip().lower() for c in st.session_state.courses):
                    st.error("Error: Course name matches an already existing syllabus subject.")
                else:
                    st.session_state.courses.append({
                        "Course Name": course_name.strip(),
                        "Credits": int(credits)
                    })
                    st.success(f"Enrolled course '{course_name}' ({credits} Credits) successfully.")

    with col_catalog:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Registered Syllabus Catalog</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Dynamic breakdown of academic modules and associated workloads.</p>
            </div>
        """, unsafe_allow_html=True)
        
        courses_df = pd.DataFrame(st.session_state.courses)
        st.dataframe(courses_df, use_container_width=True, hide_index=True)
        
        total_credits = sum(c["Credits"] for c in st.session_state.courses)
        st.markdown(f"""
            <div class='kpi-card' style='border-left: 5px solid #2563EB; margin-top: 1.5rem;'>
                <div class="kpi-icon-box icon-blue">📖</div>
                <div class="kpi-details">
                    <div class="kpi-label">Cumulative Curriculum Workload</div>
                    <div class="kpi-value">{total_credits} Credit Hours</div>
                    <div class="kpi-status status-neutral">Required for completion</div>
                </div>
            </div>
        """, unsafe_allow_html=True)


# ----------------- MODULE 4: STUDENT RECORD MANAGEMENT REDESIGN -----------------
elif st.session_state.current_page == "Student Record Management":
    st.markdown("<h2 class='section-header'>🧱 Python Collections (Lists, Dictionaries, Sets)</h2>", unsafe_allow_html=True)
    
    st.markdown("""
        <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #10B981; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
            <h4 style='margin:0; font-size:1.05rem; color:#0F172A;'>Data Collection Design Structure</h4>
            <p style='margin:4px 0 0 0; font-size:0.88rem; color:#64748B; line-height:1.4;'>
                This interface maps current student states to physical collections: 
                <b>Lists</b> store sequential records, <b>Dictionaries</b> execute key lookups, and <b>Sets</b> audit ID constraints.
            </p>
        </div>
    """, unsafe_allow_html=True)
    
    # Sync data collections
    sync_records()
    records_list = st.session_state.records_list
    records_dict = {r["ID"]: r for r in records_list}
    unique_ids_set = {r["ID"] for r in records_list}
    
    tab_add, tab_view, tab_delete = st.tabs([
        "➕ Enroll Record (List/Set Append)", 
        "🔍 Query Record (O(1) Dictionary Lookup)", 
        "❌ Remove Record (Collections Purge)"
    ])
    
    with tab_add:
        left_a, right_a = st.columns([1.2, 1.8])
        with left_a:
            st.markdown("""
                <div class="premium-card">
                    <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Direct Collections Form</h3>
                    <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1rem;">Directly modify python dictionaries and ID sets.</p>
                </div>
            """, unsafe_allow_html=True)
            
            new_id = st.text_input("Enter Student ID (e.g. S111)", key="direct_id")
            new_name = st.text_input("Enter Full Name", key="direct_name")
            new_subject = st.selectbox("Assign Subject", [c["Course Name"] for c in st.session_state.courses], key="direct_sub")
            new_marks = st.number_input("Marks Obtained", min_value=0, max_value=100, value=75, key="direct_marks")
            
            if st.button("Append to Collections"):
                if not new_id.strip() or not new_name.strip():
                    st.error("ID and Name fields cannot be blank.")
                elif new_id in unique_ids_set:
                    st.error(f"Set Constraint Error: Student ID '{new_id}' is already loaded in ID Set.")
                else:
                    # Append dict
                    records_list.append({
                        "ID": new_id.strip(),
                        "Name": new_name.strip(),
                        "Subject": new_subject,
                        "Marks": int(new_marks)
                    })
                    st.session_state.records_list = records_list
                    # Sync back to main dataframe
                    pd_data = [{"Student ID": r["ID"], "Name": r["Name"], "Subject": r["Subject"], "Marks": r["Marks"]} for r in records_list]
                    st.session_state.students_df = pd.DataFrame(pd_data)
                    st.success("Successfully pushed to python collections variables.")
                    st.rerun()
                    
        with right_a:
            st.markdown("""
                <div class="premium-card">
                    <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Active Set Structure & JSON Dump</h3>
                    <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Representations of the active python elements.</p>
                </div>
            """, unsafe_allow_html=True)
            
            st.write("##### Set of Student IDs (Unique audit set):")
            st.code(str(unique_ids_set), language="python")
            
            st.write("##### List of Student Dictionaries (Raw JSON Representation):")
            st.json(records_list[:3])
            st.caption("Displaying first 3 dictionaries inside st.session_state.records_list")
            
    with tab_view:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">O(1) Hash Map Retrieval Sandbox</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Uses direct dictionary ID mapping keys to access elements instantly.</p>
            </div>
        """, unsafe_allow_html=True)
        
        search_id = st.text_input("Enter Student ID to Query", key="query_id_direct", placeholder="e.g. S102")
        if search_id:
            if search_id in records_dict:
                item = records_dict[search_id]
                grade, remark = calculate_grade_and_remark(item["Marks"])
                st.markdown(f"""
                    <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.5rem; max-width: 480px; border-left: 6px solid #2563EB; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
                        <h4 style='margin:0 0 10px 0; font-size:1.15rem; color:#0F172A;'>Registry Profile Found ({search_id})</h4>
                        <p style='margin: 0.4rem 0;'><b>Student Name:</b> {item['Name']}</p>
                        <p style='margin: 0.4rem 0;'><b>Subject Area:</b> {item['Subject']}</p>
                        <p style='margin: 0.4rem 0;'><b>Assessed Marks:</b> {item['Marks']}</p>
                        <p style='margin: 0.4rem 0;'><b>Letter Grade:</b> <span class='badge-pass'>{grade}</span></p>
                        <p style='margin: 0.6rem 0 0 0; font-style: italic; color: #64748B;'>"{remark}"</p>
                    </div>
                """, unsafe_allow_html=True)
            else:
                st.error("Error: Key not found in mapping dictionary.")
                
    with tab_delete:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Collections Element Eviction</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Clears references from the list, set, and database tables.</p>
            </div>
        """, unsafe_allow_html=True)
        
        del_id = st.text_input("Enter Student ID to Evict", key="evict_id_direct", placeholder="e.g. S101")
        if st.button("Evict ID Record"):
            if del_id in unique_ids_set:
                st.session_state.records_list = [r for r in records_list if r["ID"] != del_id]
                # Sync back
                pd_data = [{"Student ID": r["ID"], "Name": r["Name"], "Subject": r["Subject"], "Marks": r["Marks"]} for r in st.session_state.records_list]
                st.session_state.students_df = pd.DataFrame(pd_data)
                st.success(f"Successfully deleted record '{del_id}'. Collections synchronized.")
                st.rerun()
            else:
                st.error("Error: Specified ID is missing from active unique sets.")


# ----------------- MODULE 5: SORTING & SEARCHING LAB REDESIGN -----------------
elif st.session_state.current_page == "Sorting & Searching Lab":
    st.markdown("<h2 class='section-header'>📊 Sorting & Searching Lab Simulator</h2>", unsafe_allow_html=True)
    
    tab_sort, tab_search = st.tabs(["🚀 Sorting Simulations", "🔍 Searching Simulations"])
    
    with tab_sort:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Interactive Sorting Algorithm Arena</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Sort academic database records using classical algorithmic passes and monitor step-by-step swaps.</p>
            </div>
        """, unsafe_allow_html=True)
        
        col_sort1, col_sort2 = st.columns([1, 2])
        
        with col_sort1:
            sort_key = st.selectbox("Sort Key Attribute", ["Marks", "Student ID", "Name"])
            sort_alg = st.selectbox("Sorting Logic Algorithm", ["Bubble Sort", "Selection Sort"])
            
            # Load list
            sync_records()
            items_to_sort = list(st.session_state.records_list)
            
            # Map key function
            if sort_key == "Marks":
                key_func = lambda x: x["Marks"]
            elif sort_key == "Student ID":
                key_func = lambda x: x["ID"]
            else:
                key_func = lambda x: x["Name"]
                
            run_sorting_btn = st.button("Run Sorting Sequence")
            
        with col_sort2:
            if run_sorting_btn:
                orig_vals = [f"{item['Name']} ({key_func(item)})" for item in items_to_sort]
                st.write("**Initial Registry State:**")
                st.info(", ".join(orig_vals))
                
                trace_steps = []
                n = len(items_to_sort)
                
                if sort_alg == "Bubble Sort":
                    sorted_items = list(items_to_sort)
                    trace_steps.append(("pivot", f"Initializing Bubble Sort by {sort_key}"))
                    for i in range(n):
                        swapped = False
                        for j in range(0, n-i-1):
                            val_j = key_func(sorted_items[j])
                            val_j1 = key_func(sorted_items[j+1])
                            
                            trace_steps.append(("compare", f"Comparing index {j} '{sorted_items[j]['Name']}' ({val_j}) vs index {j+1} '{sorted_items[j+1]['Name']}' ({val_j1})"))
                            
                            if val_j > val_j1:
                                sorted_items[j], sorted_items[j+1] = sorted_items[j+1], sorted_items[j]
                                swapped = True
                                trace_steps.append(("swap", f"Swap executed! Local order: {[key_func(x) for x in sorted_items]}"))
                        if not swapped:
                            trace_steps.append(("pivot", "Early Termination: No swaps occurred. List is sorted."))
                            break
                else:
                    sorted_items = list(items_to_sort)
                    trace_steps.append(("pivot", f"Initializing Selection Sort by {sort_key}"))
                    for i in range(n):
                        min_idx = i
                        for j in range(i+1, n):
                            val_j = key_func(sorted_items[j])
                            val_min = key_func(sorted_items[min_idx])
                            trace_steps.append(("compare", f"Comparing index {j} ({val_j}) vs local minimum at {min_idx} ({val_min})"))
                            if val_j < val_min:
                                min_idx = j
                                trace_steps.append(("swap", f"New local minimum recorded at index {j} ({val_j})"))
                        if min_idx != i:
                            sorted_items[i], sorted_items[min_idx] = sorted_items[min_idx], sorted_items[i]
                            trace_steps.append(("swap", f"Swapped indices {i} and {min_idx}. Values: {[key_func(x) for x in sorted_items]}"))
                
                # Render Traces with premium Styled UI Blocks instead of raw logs
                st.write("#### Algorithm Execution Timeline Trace")
                with st.expander("🔍 Click to Expand Details Execution Trace Log", expanded=True):
                    for step_type, msg in trace_steps:
                        if step_type == "compare":
                            st.markdown(f"""
                                <div class="trace-block trace-block-compare">
                                    <div class="trace-tag tag-blue">Compare</div>
                                    <div class="trace-msg">{msg}</div>
                                </div>
                            """, unsafe_allow_html=True)
                        elif step_type == "swap":
                            st.markdown(f"""
                                <div class="trace-block trace-block-swap">
                                    <div class="trace-tag tag-green">Swap/Update</div>
                                    <div class="trace-msg">{msg}</div>
                                </div>
                            """, unsafe_allow_html=True)
                        else:
                            st.markdown(f"""
                                <div class="trace-block trace-block-pivot">
                                    <div class="trace-tag tag-gold">Pivot/State</div>
                                    <div class="trace-msg">{msg}</div>
                                </div>
                            """, unsafe_allow_html=True)
                            
                st.success("Simulation complete! Sorted database values below.")
                st.dataframe(pd.DataFrame(sorted_items), use_container_width=True, hide_index=True)
                
    with tab_search:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Interactive Searching Arena</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Compare linear scanning performance vs divide-and-conquer binary searches.</p>
            </div>
        """, unsafe_allow_html=True)
        
        col_s1, col_s2 = st.columns([1, 2])
        
        with col_s1:
            search_key_type = st.radio("Search Identifier Key", ["Student ID", "Name"])
            search_query = st.text_input("Target Query Value", placeholder="e.g. S102 or Bob Johnson")
            search_alg = st.selectbox("Search Strategy Method", ["Linear Search", "Binary Search (Auto-sorted keys)"])
            
            run_search_btn = st.button("Initialize Search")
            
        with col_s2:
            if run_search_btn:
                if not search_query.strip():
                    st.error("Please supply a valid query key.")
                else:
                    sync_records()
                    arr = list(st.session_state.records_list)
                    
                    if search_key_type == "Student ID":
                        key_func = lambda x: x["ID"]
                    else:
                        key_func = lambda x: x["Name"]
                        
                    trace_logs = []
                    found_idx = -1
                    
                    if "Linear" in search_alg:
                        trace_logs.append(("pivot", "Launching Linear Scan (checks index sequentially)..."))
                        for idx, x in enumerate(arr):
                            val = key_func(x)
                            trace_logs.append(("compare", f"Index {idx} Check: '{val}' vs target '{search_query}'"))
                            if val.lower() == search_query.strip().lower():
                                trace_logs.append(("swap", f"Match detected at index {idx}! Terminating scan."))
                                found_idx = idx
                                break
                    else:
                        trace_logs.append(("pivot", "Binary Search requires sorted bounds. Performing pre-sorting..."))
                        sorted_arr = sorted(arr, key=key_func)
                        trace_logs.append(("pivot", f"Sorted bounds keys: {[key_func(item) for item in sorted_arr]}"))
                        
                        low = 0
                        high = len(sorted_arr) - 1
                        target_lower = search_query.strip().lower()
                        
                        while low <= high:
                            mid = (low + high) // 2
                            val = key_func(sorted_arr[mid]).lower()
                            trace_logs.append(("compare", f"Checking mid-point {mid} ('{key_func(sorted_arr[mid])}') inside index boundary limits [{low}, {high}]"))
                            
                            if val == target_lower:
                                trace_logs.append(("swap", f"Target match found at index {mid} of sorted boundary range."))
                                for orig_idx, item in enumerate(arr):
                                    if key_func(item).lower() == target_lower:
                                        found_idx = orig_idx
                                        break
                                break
                            elif val < target_lower:
                                trace_logs.append(("pivot", f"'{val}' < '{target_lower}'. Truncating left half. Shifting boundary low = {mid+1}"))
                                low = mid + 1
                            else:
                                trace_logs.append(("pivot", f"'{val}' > '{target_lower}'. Truncating right half. Shifting boundary high = {mid-1}"))
                                high = mid - 1
                                
                    # Display searching trace logs
                    st.write("#### Search Algorithm Progression Traces")
                    with st.expander("🔍 View Search Comparison Traces", expanded=True):
                        for log_type, msg in trace_logs:
                            if log_type == "compare":
                                st.markdown(f"""
                                    <div class="trace-block trace-block-compare">
                                        <div class="trace-tag tag-blue">Compare</div>
                                        <div class="trace-msg">{msg}</div>
                                    </div>
                                """, unsafe_allow_html=True)
                            elif log_type == "swap":
                                st.markdown(f"""
                                    <div class="trace-block trace-block-swap">
                                        <div class="trace-tag tag-green">Match Found</div>
                                        <div class="trace-msg">{msg}</div>
                                    </div>
                                """, unsafe_allow_html=True)
                            else:
                                st.markdown(f"""
                                    <div class="trace-block trace-block-pivot">
                                        <div class="trace-tag tag-gold">Scope Shift</div>
                                        <div class="trace-msg">{msg}</div>
                                    </div>
                                """, unsafe_allow_html=True)
                                
                    if found_idx != -1:
                        match = arr[found_idx]
                        st.success(f"Successful! Match located at original list index {found_idx}.")
                        st.markdown(f"""
                            <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.5rem; max-width: 450px; border-left: 5px solid #10B981; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
                                <h4 style='margin:0 0 8px 0; font-size:1.1rem; color:#0F172A;'>Registry Details Record</h4>
                                <p style='margin:0.25rem 0;'><b>Student ID:</b> {match['ID']}</p>
                                <p style='margin:0.25rem 0;'><b>Student Name:</b> {match['Name']}</p>
                                <p style='margin:0.25rem 0;'><b>Subject Area:</b> {match['Subject']}</p>
                                <p style='margin:0.25rem 0;'><b>Exam Marks:</b> {match['Marks']}</p>
                            </div>
                        """, unsafe_allow_html=True)
                    else:
                        st.error("Error: Specified key query was not found in collections.")


# ----------------- MODULE 6: FEE MANAGEMENT SYSTEM REDESIGN -----------------
elif st.session_state.current_page == "Fee Management System":
    st.markdown("<h2 class='section-header'>💳 Fee Management Financial Dashboard</h2>", unsafe_allow_html=True)
    
    col_input, col_bill = st.columns([1, 1.2])
    
    with col_input:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Bill Assessment Invoicing</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Adjust parameters and compile invoices dynamically.</p>
            </div>
        """, unsafe_allow_html=True)
        
        tuition = st.number_input("Tuition Allocation Fee ($)", min_value=0.0, max_value=200000.0, value=65000.0, step=1000.0)
        hostel = st.number_input("Hostel Accommodation Allocation ($)", min_value=0.0, max_value=100000.0, value=15000.0, step=500.0)
        transport = st.number_input("Transport Logistics Allocation ($)", min_value=0.0, max_value=50000.0, value=4500.0, step=100.0)
        
        scholarship_type = st.selectbox(
            "Select Performance Scholarship Waiver", 
            ["No Scholarship", "Merit Waiver (15% off Tuition)", "Dean's Scholarship (30% off Tuition)", "Custom Discount"]
        )
        
        discount_pct = 0.0
        if scholarship_type == "Merit Waiver (15% off Tuition)":
            discount_pct = 0.15
        elif scholarship_type == "Dean's Scholarship (30% off Tuition)":
            discount_pct = 0.30
        elif scholarship_type == "Custom Discount":
            discount_pct = st.slider("Select Custom Percentage (%)", 0, 100, 10) / 100.0
            
        discount_amount = tuition * discount_pct
        final_tuition = tuition - discount_amount
        total_fee = final_tuition + hostel + transport
        
    with col_bill:
        # SaaS Invoice styling
        st.markdown(f"""
            <div class="bill-invoice">
                <div class="invoice-header">
                    <span class="invoice-title-text">EduSphere Invoice Breakdown</span>
                    <span style="background-color: #ECFDF5; color: #10B981; font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; text-transform: uppercase;">Waiver Applied</span>
                </div>
                <div class="invoice-item-row">
                    <span>Base Tuition Fee:</span>
                    <span style="font-weight: 600; color: #0F172A;">${tuition:,.2f}</span>
                </div>
                <div class="invoice-item-row" style="color: #DC2626;">
                    <span>Scholarship Waiver ({discount_pct*100:.0f}%):</span>
                    <span style="font-weight: 600;">-${discount_amount:,.2f}</span>
                </div>
                <div class="invoice-item-row">
                    <span>Net Tuition Fee:</span>
                    <span style="font-weight: 600; color: #0F172A;">${final_tuition:,.2f}</span>
                </div>
                <div class="invoice-item-row">
                    <span>Hostel Accommodations:</span>
                    <span style="font-weight: 600; color: #0F172A;">${hostel:,.2f}</span>
                </div>
                <div class="invoice-item-row">
                    <span>Transport Commute:</span>
                    <span style="font-weight: 600; color: #0F172A;">${transport:,.2f}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Total Net Fees Due:</span>
                    <span>${total_fee:,.2f}</span>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        st.write("#### Fee Composition Ratios")
        # Visual fee composition pie chart
        fig, ax = plt.subplots(figsize=(5, 3.8))
        labels = ['Tuition', 'Hostel', 'Transport']
        sizes = [final_tuition, hostel, transport]
        colors = ['#10B981', '#1E3A8A', '#2563EB']
        ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors,
               wedgeprops=dict(width=0.4, edgecolor='w'))
        ax.set_title("Fee Breakdown Composition Ratio", fontsize=11, fontweight='bold', pad=15)
        plt.tight_layout()
        st.pyplot(fig)
        
        # Payment installments tracker
        st.write("#### Installment Billing Progress Indicator")
        paid_amount = st.slider("Specify Payments Settled To-Date ($)", 0.0, float(total_fee), float(total_fee * 0.4), step=100.0)
        remaining = total_fee - paid_amount
        percent_paid = (paid_amount / total_fee * 100) if total_fee > 0 else 0
        
        st.progress(percent_paid / 100.0)
        st.markdown(f"**Collected Balance:** {percent_paid:.1f}% (${paid_amount:,.2f}) | **Deficit Receivable:** ${remaining:,.2f}")


# ----------------- MODULE 7: ACADEMIC FILE MANAGEMENT REDESIGN -----------------
elif st.session_state.current_page == "Academic File Management":
    st.markdown("<h2 class='section-header'>📂 Academic File System Storage I/O</h2>", unsafe_allow_html=True)
    
    st.markdown("""
        <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #2563EB; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
            <h4 style='margin:0; font-size:1.05rem; color:#0F172A;'>File Systems I/O Integration Lab</h4>
            <p style='margin:4px 0 0 0; font-size:0.88rem; color:#64748B; line-height:1.4;'>
                This workspace writes internal session arrays directly to local directory storage (CSV format) and generates summarized performance reports.
            </p>
        </div>
    """, unsafe_allow_html=True)
    
    col_write, col_read = st.columns(2)
    
    with col_write:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">File Exporter Services</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Specify files names to export local state information.</p>
            </div>
        """, unsafe_allow_html=True)
        
        export_csv_name = st.text_input("Database CSV Output Filename", value="academic_records_export.csv")
        export_txt_name = st.text_input("Summary Performance Text Report", value="academic_summary.txt")
        
        if st.button("Generate & Write Data Files"):
            df = st.session_state.students_df
            # CSV write
            try:
                df.to_csv(export_csv_name, index=False)
                st.success(f"CSV database file `{export_csv_name}` written successfully ({len(df)} records).")
            except Exception as e:
                st.error(f"Failed to write CSV: {e}")
            # TXT Summary Write
            try:
                with open(export_txt_name, "w") as f:
                    f.write("===================================================\n")
                    f.write("        EDUSPHERE ACADEMIC REGISTRY EXPORT REPORT  \n")
                    f.write("===================================================\n")
                    f.write(f"Registry Total Count: {len(df)} Students\n")
                    f.write(f"Class Average Performance Score: {df['Marks'].mean():.2f}\n")
                    f.write(f"Class High Marks: {df['Marks'].max()}\n")
                    f.write(f"Class Low Marks: {df['Marks'].min()}\n")
                    f.write("\n===================================================\n")
                    f.write("Detailed Profile Ensembles Registry Output:\n")
                    f.write("---------------------------------------------------\n")
                    f.write("ID\tName\tCourse Subject\tMarks\tCalculated Grade\n")
                    for _, row in df.iterrows():
                        grade, _ = calculate_grade_and_remark(row["Marks"])
                        f.write(f"{row['Student ID']}\t{row['Name']}\t{row['Subject']}\t{row['Marks']}\t{grade}\n")
                st.success(f"Syllabus summary report `{export_txt_name}` written successfully.")
            except Exception as e:
                st.error(f"Failed to compile text report: {e}")
                
    with col_read:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">File Importer Services</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Specify files names to restore application data states.</p>
            </div>
        """, unsafe_allow_html=True)
        
        import_file_name = st.text_input("Source Import File (CSV)", value="academic_records_export.csv")
        
        if st.button("Import Records into Session State"):
            if not os.path.exists(import_file_name):
                st.error(f"File '{import_file_name}' not found. Please export first.")
            else:
                try:
                    loaded_df = pd.read_csv(import_file_name)
                    st.session_state.students_df = loaded_df
                    sync_records()
                    st.success(f"Successfully reloaded {len(loaded_df)} records into current state.")
                    st.dataframe(loaded_df, use_container_width=True)
                except Exception as e:
                    st.error(f"Import process failed: {e}")
                    
        # Render TXT contents if file exists
        if os.path.exists(export_txt_name):
            with st.expander("📄 Click to View Local Report Output (`" + export_txt_name + "`)"):
                try:
                    with open(export_txt_name, "r") as file_read:
                        content = file_read.read()
                        st.text(content)
                except Exception as e:
                    st.error(f"Failed to read report: {e}")


# ----------------- MODULE 8: DIRECTORY SCANNER REDESIGN -----------------
elif st.session_state.current_page == "Directory Scanner":
    st.markdown("<h2 class='section-header'>📁 Directory Structure & Exception Handling</h2>", unsafe_allow_html=True)
    
    st.markdown("""
        <div style='background-color: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #F59E0B; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>
            <h4 style='margin:0; font-size:1.05rem; color:#0F172A;'>Exception Handling Lab Suite</h4>
            <p style='margin:4px 0 0 0; font-size:0.88rem; color:#64748B; line-height:1.4;'>
                Validates local file system paths. Captures <b>FileNotFoundError</b>, <b>NotADirectoryError</b>, and raises a user-defined custom exception <b>EmptyFolderError</b>.
            </p>
        </div>
    """, unsafe_allow_html=True)
    
    dir_path = st.text_input("Local Folder Path to scan", value=".")
    
    col_scan, col_temp = st.columns(2)
    
    with col_scan:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Directory Scanner Simulator</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Scan directory and verify exceptions.</p>
            </div>
        """, unsafe_allow_html=True)
        
        if st.button("Scan Local Directory"):
            try:
                # 1. Existence check (FileNotFoundError)
                if not os.path.exists(dir_path):
                    raise FileNotFoundError(f"The path '{dir_path}' could not be resolved by the file system.")
                
                # 2. Folder check (NotADirectoryError)
                if not os.path.isdir(dir_path):
                    raise NotADirectoryError(f"The path '{dir_path}' resolves to a file, not a workspace directory.")
                    
                # 3. Read folder
                contents = os.listdir(dir_path)
                
                # 4. Check contents (Custom Exception empty folder)
                if len(contents) == 0:
                    raise EmptyFolderError(f"The directory '{dir_path}' contains zero files or subfolders.")
                    
                st.success(f"Scan complete! Folder '{dir_path}' contents:")
                
                dirs = []
                files = []
                for item in contents:
                    p = os.path.join(dir_path, item)
                    if os.path.isdir(p):
                        dirs.append(item)
                    else:
                        files.append(item)
                        
                for d in dirs:
                    st.markdown(f"📁 **{d}** (Directory)")
                for f in files:
                    try:
                        sz = os.path.getsize(os.path.join(dir_path, f))
                        st.markdown(f"📄 {f} *({sz:,} bytes)*")
                    except Exception:
                        st.markdown(f"📄 {f}")
                        
            except FileNotFoundError as err:
                st.error("❌ **Standard FileNotFoundError Trapped:**")
                st.markdown(f"""
                    <div style='background-color:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:1rem; color:#991B1B;'>
                        <strong>Error Message:</strong> {err}<br>
                        <small style='color:#7F1D1D;'>Action: Please input an existing local system path.</small>
                    </div>
                """, unsafe_allow_html=True)
                
            except NotADirectoryError as err:
                st.error("❌ **Standard NotADirectoryError Trapped:**")
                st.markdown(f"""
                    <div style='background-color:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:1rem; color:#991B1B;'>
                        <strong>Error Message:</strong> {err}<br>
                        <small style='color:#7F1D1D;'>Action: Supply a valid directory path instead of a file name.</small>
                    </div>
                """, unsafe_allow_html=True)
                
            except EmptyFolderError as err:
                st.warning("⚠️ **Custom EmptyFolderError Exception Trapped:**")
                st.markdown(f"""
                    <div style='background-color:#FFFBEB; border:1px solid #FDE047; border-radius:10px; padding:1rem; color:#92400E;'>
                        <strong>Error Message:</strong> {err}<br>
                        <small style='color:#78350F;'>Action: This represents a custom exception raised for empty folders containing 0 files.</small>
                    </div>
                """, unsafe_allow_html=True)
                
            except Exception as err:
                st.error(f"❌ **General Catch-all Exception Trapped:** {err}")
                
    with col_temp:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.2rem; color: #0F172A;">Temporary Sandbox Environment</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem;">Create empty folder elements to test the Custom Exception logic.</p>
            </div>
        """, unsafe_allow_html=True)
        
        sandbox_folder = st.text_input("Temporary folder name", value="temp_sandbox_empty_folder")
        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            if st.button("Generate Empty Folder"):
                if not sandbox_folder.strip():
                    st.error("Please enter a name.")
                else:
                    try:
                        os.makedirs(sandbox_folder, exist_ok=True)
                        st.success(f"Generated directory `{sandbox_folder}`. You can now scan it above.")
                    except Exception as e:
                        st.error(f"Failed: {e}")
        with col_btn2:
            if st.button("Delete Sandbox Folder"):
                if os.path.exists(sandbox_folder):
                    try:
                        os.rmdir(sandbox_folder)
                        st.success(f"Cleaned up directory `{sandbox_folder}`.")
                    except Exception as e:
                        st.error(f"Failed to clear (verify folder is empty): {e}")
                else:
                    st.warning("Path doesn't exist.")


# ----------------- MODULE 9: PERFORMANCE ANALYTICS REDESIGN -----------------
elif st.session_state.current_page == "Performance Analytics":
    st.markdown("<h2 class='section-header'>📈 Academic Performance Analytics</h2>", unsafe_allow_html=True)
    
    df = st.session_state.students_df
    
    if len(df) == 0:
        st.warning("Database contains zero profiles to compute analytics on. Fill out student records first.")
    else:
        # Calculate statistics using NumPy
        marks_array = df["Marks"].to_numpy()
        mean_val = np.mean(marks_array)
        median_val = np.median(marks_array)
        std_val = np.std(marks_array)
        
        # NumPy analytics metrics
        st.markdown(f"""
            <div class="kpi-container">
                <div class="kpi-card" style="border-left: 5px solid #10B981;">
                    <div class="kpi-icon-box icon-emerald">📊</div>
                    <div class="kpi-details">
                        <div class="kpi-label">NumPy Statistical Mean</div>
                        <div class="kpi-value">{mean_val:.2f}</div>
                        <div class="kpi-status status-up">Overall Average Score</div>
                    </div>
                </div>
                <div class="kpi-card" style="border-left: 5px solid #2563EB;">
                    <div class="kpi-icon-box icon-blue">🎯</div>
                    <div class="kpi-details">
                        <div class="kpi-label">NumPy Median Score</div>
                        <div class="kpi-value">{median_val:.1f}</div>
                        <div class="kpi-status status-neutral">Midpoint Score</div>
                    </div>
                </div>
                <div class="kpi-card" style="border-left: 5px solid #F59E0B;">
                    <div class="kpi-icon-box icon-gold">📐</div>
                    <div class="kpi-details">
                        <div class="kpi-label">NumPy Std Deviation</div>
                        <div class="kpi-value">{std_val:.2f}</div>
                        <div class="kpi-status status-accent">Score Dispersion</div>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        col_charts_left, col_charts_right = st.columns(2)
        
        with col_charts_left:
            st.markdown("""
                <div class="premium-card">
                    <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Student Score Comparison Chart</h3>
                </div>
            """, unsafe_allow_html=True)
            # Matplotlib Bar Chart
            fig, ax = plt.subplots(figsize=(6, 3.8))
            colors = ['#10B981' if m >= 75 else '#2563EB' for m in df["Marks"]]
            ax.bar(df["Name"], df["Marks"], color=colors, edgecolor='#E2E8F0', width=0.55)
            ax.set_ylabel("Marks Obtained", fontsize=9, fontweight='semibold')
            ax.set_xlabel("Student Profile Name", fontsize=9, fontweight='semibold')
            ax.set_ylim(0, 110)
            plt.xticks(rotation=30, ha='right', fontsize=8)
            ax.grid(axis='y', linestyle='--', alpha=0.3)
            # Make spines thin
            for spine in ['top', 'right']:
                ax.spines[spine].set_visible(False)
            plt.tight_layout()
            st.pyplot(fig)
            
            st.write("##### 👑 Performance Podium Leaderboard")
            # Sort for top performing podium
            sorted_performers = df.sort_values(by="Marks", ascending=False).head(3).reset_index()
            
            name_1 = sorted_performers.loc[0, "Name"] if len(sorted_performers) > 0 else "N/A"
            score_1 = sorted_performers.loc[0, "Marks"] if len(sorted_performers) > 0 else 0
            
            name_2 = sorted_performers.loc[1, "Name"] if len(sorted_performers) > 1 else "N/A"
            score_2 = sorted_performers.loc[1, "Marks"] if len(sorted_performers) > 1 else 0
            
            name_3 = sorted_performers.loc[2, "Name"] if len(sorted_performers) > 2 else "N/A"
            score_3 = sorted_performers.loc[2, "Marks"] if len(sorted_performers) > 2 else 0
            
            st.markdown(f"""
                <div class="podium-container">
                    <div class="podium-card podium-2nd">
                        <div class="podium-num">2</div>
                        <div class="podium-name-txt">{name_2.split()[0]}</div>
                        <div class="podium-score-txt">{score_2} Marks</div>
                    </div>
                    <div class="podium-card podium-1st">
                        <div class="podium-num">1</div>
                        <div class="podium-name-txt">{name_1.split()[0]}</div>
                        <div class="podium-score-txt">{score_1} Marks</div>
                    </div>
                    <div class="podium-card podium-3rd">
                        <div class="podium-num">3</div>
                        <div class="podium-name-txt">{name_3.split()[0]}</div>
                        <div class="podium-score-txt">{score_3} Marks</div>
                    </div>
                </div>
            """, unsafe_allow_html=True)
            
        with col_charts_right:
            st.markdown("""
                <div class="premium-card">
                    <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Grade Distribution Donut Chart</h3>
                </div>
            """, unsafe_allow_html=True)
            
            # Donut chart computations
            grades_list = [calculate_grade_and_remark(m)[0] for m in df["Marks"]]
            from collections import Counter
            counts = Counter(grades_list)
            sorted_grades = sorted(counts.keys())
            sorted_counts = [counts[g] for g in sorted_grades]
            
            fig_pie, ax_pie = plt.subplots(figsize=(6, 3.8))
            pie_colors = ['#10B981', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][:len(sorted_grades)]
            ax_pie.pie(sorted_counts, labels=sorted_grades, autopct='%1.1f%%', startangle=90, colors=pie_colors,
                       wedgeprops=dict(width=0.4, edgecolor='w'))
            ax_pie.set_title("Registered Grade Ratios", fontsize=10, fontweight='bold')
            plt.tight_layout()
            st.pyplot(fig_pie)
            
            st.markdown("""
                <div class="premium-card" style="margin-top: 1rem;">
                    <h3 style="margin-top: 0; font-size: 1.15rem; color: #0F172A;">Subject Average Performance (Pandas GroupBy)</h3>
                </div>
            """, unsafe_allow_html=True)
            
            subject_avgs = df.groupby("Subject")["Marks"].mean().reset_index()
            # Plot horizontal averages
            fig_sub, ax_sub = plt.subplots(figsize=(6, 3.8))
            ax_sub.barh(subject_avgs["Subject"], subject_avgs["Marks"], color='#1E3A8A', edgecolor='#E2E8F0', height=0.5)
            ax_sub.set_xlabel("Average Marks", fontsize=9, fontweight='semibold')
            ax_sub.set_xlim(0, 110)
            ax_sub.grid(axis='x', linestyle='--', alpha=0.3)
            for spine in ['top', 'right']:
                ax_sub.spines[spine].set_visible(False)
            plt.tight_layout()
            st.pyplot(fig_sub)
            
            st.dataframe(subject_avgs.rename(columns={"Marks": "Mean Marks Rating"}), hide_index=True, use_container_width=True)


# ----------------- MODULE 10: ACADEMIC ASSISTANT REDESIGN -----------------
elif st.session_state.current_page == "Academic Assistant":
    st.markdown("<h2 class='section-header'>💬 Rule-based Academic Assistant</h2>", unsafe_allow_html=True)
    
    left_chat, right_tips = st.columns([2, 1])
    
    with left_chat:
        st.markdown("""
            <div class="premium-card" style="margin-bottom: 1.5rem;">
                <h3 style="margin-top: 0; font-size: 1.25rem; color: #0F172A;">EduSphere Virtual Chat Desk</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 0;">Interact with our rule-based assistant to query policy metrics.</p>
            </div>
        """, unsafe_allow_html=True)
        
        # Render chat bubbles with profile indicators
        for message in st.session_state.chat_history:
            role = message["role"]
            content = message["content"]
            with st.chat_message(role):
                if role == "assistant":
                    st.markdown(f"🤖 **EduSphere Assistant:**  \n{content}")
                else:
                    st.markdown(f"👤 **You:**  \n{content}")
                    
        # Helper chatbot engine response logic
        def get_chat_response(query):
            q = query.lower()
            if "gpa" in q or "calculate" in q or "grade" in q:
                return ("**GPA Calculation Guidelines:**  \n"
                        "GPA is computed as the weighted average of course credits and grading scale:  \n"
                        "- **A (90-100)**: 4.0 points  \n"
                        "- **B (80-89)**: 3.0 points  \n"
                        "- **C (70-79)**: 2.0 points  \n"
                        "- **D (60-69)**: 1.0 points  \n"
                        "- **E/F (Below 60)**: 0.0 points  \n\n"
                        "**Calculation Formula:** `GPA = Sum(Grade Points * Course Credits) / Total Enrolled Credits`.")
            elif "fee" in q or "cost" in q or "tuition" in q:
                return ("**Fee Billing Assessment Info:**  \n"
                        "Academic invoices cover three key fields: Tuition Fees, Hostel Accommodation, and Transport Logistics. "
                        "High performing students are eligible for Merit (15% off) and Dean's (30% off) waivers. Modify parameters inside the **Fee Management System** tab.")
            elif "attendance" in q or "leave" in q or "class" in q:
                return ("**Attendance Policy Requirement:**  \n"
                        "To be eligible to sit for final end-semester examinations, students must maintain a **minimum of 75% attendance** in each registered course syllabus. Failures to comply will result in examination debarment.")
            elif "register" in q or "enroll" in q or "course" in q:
                return ("**Course Registration Guide:**  \n"
                        "Click the **📚 Courses** tab on the top navigation bar. "
                        "Specify the Subject Title and Credit Hour details, then select 'Enroll Course into Syllabus' to update the curriculum catalog.")
            else:
                return ("I'm sorry, I could not resolve that query. Try asking about **GPA calculations**, **Fee structure**, **Attendance policies**, or **Course registration**.")

        # Capture suggestion click chips
        st.write("💡 **Ask or select a suggestion chip below:**")
        
        col_chip1, col_chip2 = st.columns(2)
        with col_chip1:
            if st.button("📊 How is GPA calculated?", key="chip_gpa"):
                prompt = "How is GPA calculated?"
                st.session_state.chat_history.append({"role": "user", "content": prompt})
                st.session_state.chat_history.append({"role": "assistant", "content": get_chat_response(prompt)})
                st.rerun()
            if st.button("💳 What is the fee structure?", key="chip_fee"):
                prompt = "What is the fee structure?"
                st.session_state.chat_history.append({"role": "user", "content": prompt})
                st.session_state.chat_history.append({"role": "assistant", "content": get_chat_response(prompt)})
                st.rerun()
        with col_chip2:
            if st.button("⚠️ What is the attendance policy?", key="chip_attendance"):
                prompt = "What is the attendance policy?"
                st.session_state.chat_history.append({"role": "user", "content": prompt})
                st.session_state.chat_history.append({"role": "assistant", "content": get_chat_response(prompt)})
                st.rerun()
            if st.button("📚 How do I register a course?", key="chip_course"):
                prompt = "How do I register a course?"
                st.session_state.chat_history.append({"role": "user", "content": prompt})
                st.session_state.chat_history.append({"role": "assistant", "content": get_chat_response(prompt)})
                st.rerun()

        # Capture manual inputs
        if manual_prompt := st.chat_input("Ask a custom question..."):
            st.session_state.chat_history.append({"role": "user", "content": manual_prompt})
            st.session_state.chat_history.append({"role": "assistant", "content": get_chat_response(manual_prompt)})
            st.rerun()

    with right_tips:
        st.markdown("""
            <div class="premium-card">
                <h3 style="margin-top: 0; font-size: 1.1rem; color: #0F172A;">Conversation Context</h3>
                <p style="color: #64748B; font-size: 0.85rem; line-height: 1.4;">
                    The assistant parses exact queries using keyword mappings for GPA, Fees, Registration, and Attendance criteria.
                </p>
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem; font-size: 0.82rem; color: #475569;">
                    💬 <strong>Logs:</strong> Rule-based pattern matching activated.
                </div>
            </div>
        """, unsafe_allow_html=True)
