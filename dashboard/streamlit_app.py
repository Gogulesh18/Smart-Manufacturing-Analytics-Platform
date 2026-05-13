import streamlit as st
import pandas as pd
import joblib

# ----------------------------
# PAGE CONFIG
# ----------------------------
st.set_page_config(
    page_title="Smart Manufacturing Analytics",
    layout="wide"
)

# ----------------------------
# TITLE SECTION
# ----------------------------
st.title("AI-Powered Smart Manufacturing Efficiency Platform")
st.subheader("Predictive Maintenance + Industrial KPI Dashboard")

# ----------------------------
# LOAD MODEL & DATA
# ----------------------------
model = joblib.load("models/predictive_model.pkl")
df = pd.read_csv("data/cleaned_data_supabase_final.csv")

# ----------------------------
# KPI METRICS
# ----------------------------
failure_rate = round(df['machine_failure'].mean() * 100, 2)
avg_torque = round(df['torque'].mean(), 2)
avg_tool_wear = round(df['tool_wear'].mean(), 2)

high_risk_count = len(
    df[
        (df['torque'] > 50) &
        (df['tool_wear'] > 200)
    ]
)

col1, col2, col3, col4 = st.columns(4)

col1.metric("Failure Rate (%)", failure_rate)
col2.metric("Average Torque", avg_torque)
col3.metric("Average Tool Wear", avg_tool_wear)
col4.metric("High-Risk Machines", high_risk_count)

# ----------------------------
# FAILURE DISTRIBUTION
# ----------------------------
st.subheader("Machine Failure Distribution")
st.bar_chart(df['machine_failure'].value_counts())

# ----------------------------
# OPERATIONAL RISK INDICATORS
# ----------------------------
st.subheader("Operational Risk Indicators")
risk_metrics = pd.DataFrame({
    "Metric": ["Torque", "Tool Wear", "Air Temp", "Process Temp"],
    "Average Value": [
        df['torque'].mean(),
        df['tool_wear'].mean(),
        df['air_temp'].mean(),
        df['process_temp'].mean()
    ]
})

st.bar_chart(risk_metrics.set_index("Metric"))

# ----------------------------
# SIDEBAR INPUTS
# ----------------------------
st.sidebar.header("Machine Input Parameters")

air_temp = st.sidebar.slider(
    "Air Temperature",
    float(df.air_temp.min()),
    float(df.air_temp.max()),
    float(df.air_temp.mean())
)

process_temp = st.sidebar.slider(
    "Process Temperature",
    float(df.process_temp.min()),
    float(df.process_temp.max()),
    float(df.process_temp.mean())
)

rot_speed = st.sidebar.slider(
    "Rotational Speed",
    int(df.rotational_speed.min()),
    int(df.rotational_speed.max()),
    int(df.rotational_speed.mean())
)

torque = st.sidebar.slider(
    "Torque",
    float(df.torque.min()),
    float(df.torque.max()),
    float(df.torque.mean())
)

tool_wear = st.sidebar.slider(
    "Tool Wear",
    int(df.tool_wear.min()),
    int(df.tool_wear.max()),
    int(df.tool_wear.mean())
)

machine_type = st.sidebar.selectbox(
    "Machine Type",
    ["H", "L", "M"]
)

# ----------------------------
# MACHINE TYPE ENCODING
# ----------------------------
type_l = 1 if machine_type == "L" else 0
type_m = 1 if machine_type == "M" else 0

# ----------------------------
# INPUT DATAFRAME
# ----------------------------
input_data = pd.DataFrame({
    'air_temp': [air_temp],
    'process_temp': [process_temp],
    'rotational_speed': [rot_speed],
    'torque': [torque],
    'tool_wear': [tool_wear],
    'twf': [0],
    'hdf': [0],
    'pwf': [0],
    'osf': [0],
    'rnf': [0],
    'type_l': [type_l],
    'type_m': [type_m]
})

# ----------------------------
# PREDICTION BUTTON
# ----------------------------
if st.sidebar.button("Predict Machine Health"):

    prediction = model.predict(input_data)
    prediction_prob = model.predict_proba(input_data)[0][1] * 100

    st.subheader("Predictive Maintenance Result")

    if prediction[0] == 1:
        st.error(
            f"⚠️ High Risk: Machine Failure Predicted ({prediction_prob:.2f}% probability)"
        )

        st.warning(
            "Recommended Action: Immediate maintenance inspection required."
        )

    else:
        st.success(
            f"✅ Machine Operating Normally ({100 - prediction_prob:.2f}% safe probability)"
        )

        st.info(
            "Recommended Action: Continue standard monitoring."
        )

# ----------------------------
# RAW DATA PREVIEW
# ----------------------------
with st.expander("View Sample Manufacturing Data"):
    st.dataframe(df.head(20))

# ----------------------------
# FOOTER
# ----------------------------
st.markdown("---")
st.caption(
    "Developed as an AI-Powered Smart Manufacturing Efficiency & Predictive Analytics Platform for Industrial Automation, Predictive Maintenance, and Data-Driven Operational Excellence."
)