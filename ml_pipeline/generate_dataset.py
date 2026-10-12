"""
VitalWatch - Patient Vitals Simulation Dataset Generator
Generates realistic multi-patient vital sign time-series with 6-hour deterioration labels.
Conforms to MIMIC-IV / PhysioNet data standards.
"""

import os
import random
import numpy as np
import pandas as pd

def generate_patient_trajectory(patient_id, hours=48, trajectory_type='stable'):
    """Generate time series for a single patient stay."""
    timestamps = []
    hrs = []
    sbps = []
    dbps = []
    spo2s = []
    rrs = []
    temps = []
    consciousness = []
    supp_o2 = []
    labels = []  # 1 = deterioration in next 6 hours, 0 = stable
    
    # Baseline vitals
    base_hr = np.random.normal(76, 8)
    base_sbp = np.random.normal(122, 12)
    base_dbp = base_sbp * 0.65
    base_spo2 = np.random.normal(97.5, 1.2)
    base_rr = np.random.normal(16, 2)
    base_temp = np.random.normal(36.8, 0.3)
    
    event_hour = None
    if trajectory_type != 'stable':
        event_hour = hours - random.randint(4, 12)
        
    for h in range(hours * 6):  # reading every 10 minutes
        t_hour = h / 6.0
        
        # Check if within 6h before event
        is_deterioration_window = 0
        if event_hour is not None and (event_hour - 6.0) <= t_hour <= event_hour:
            is_deterioration_window = 1
            
        progress = 0.0
        if event_hour is not None and t_hour >= (event_hour - 8.0):
            progress = max(0.0, min(1.0, (t_hour - (event_hour - 8.0)) / 8.0))
            
        # Modulate vitals by trajectory
        if trajectory_type == 'sepsis':
            hr = base_hr + progress * 45 + np.random.normal(0, 3)
            sbp = base_sbp - progress * 35 + np.random.normal(0, 4)
            dbp = base_dbp - progress * 20 + np.random.normal(0, 3)
            spo2 = base_spo2 - progress * 7 + np.random.normal(0, 0.8)
            rr = base_rr + progress * 14 + np.random.normal(0, 1.5)
            temp = base_temp + progress * 2.2 + np.random.normal(0, 0.2)
            c = 'Alert' if progress < 0.7 else 'Voice'
            o2 = 1 if progress > 0.4 else 0
        elif trajectory_type == 'respiratory':
            hr = base_hr + progress * 32 + np.random.normal(0, 3)
            sbp = base_sbp + (progress * 15 if progress < 0.6 else -15) + np.random.normal(0, 4)
            dbp = base_dbp + np.random.normal(0, 3)
            spo2 = base_spo2 - progress * 15 + np.random.normal(0, 1.0)
            rr = base_rr + progress * 18 + np.random.normal(0, 2)
            temp = base_temp + np.random.normal(0, 0.2)
            c = 'Alert' if progress < 0.8 else 'Voice'
            o2 = 1 if progress > 0.3 else 0
        elif trajectory_type == 'cardiac':
            hr = base_hr + progress * 38 + np.random.normal(0, 4)
            sbp = base_sbp - progress * 40 + np.random.normal(0, 4)
            dbp = base_dbp - progress * 22 + np.random.normal(0, 3)
            spo2 = base_spo2 - progress * 5 + np.random.normal(0, 0.8)
            rr = base_rr + progress * 8 + np.random.normal(0, 1.2)
            temp = base_temp + np.random.normal(0, 0.2)
            c = 'Alert' if progress < 0.75 else 'Pain'
            o2 = 1 if progress > 0.5 else 0
        else:
            # Stable baseline
            hr = base_hr + np.random.normal(0, 2)
            sbp = base_sbp + np.random.normal(0, 3)
            dbp = base_dbp + np.random.normal(0, 2)
            spo2 = base_spo2 + np.random.normal(0, 0.4)
            rr = base_rr + np.random.normal(0, 0.8)
            temp = base_temp + np.random.normal(0, 0.1)
            c = 'Alert'
            o2 = 0
            
        timestamps.append(t_hour)
        hrs.append(max(35, min(180, hr)))
        sbps.append(max(50, min(220, sbp)))
        dbps.append(max(30, min(120, dbp)))
        spo2s.append(max(65, min(100, spo2)))
        rrs.append(max(6, min(45, rr)))
        temps.append(round(max(34.0, min(41.5, temp)), 1))
        consciousness.append(c)
        supp_o2.append(o2)
        labels.append(is_deterioration_window)
        
    df = pd.DataFrame({
        'patient_id': patient_id,
        'time_hours': timestamps,
        'heart_rate': hrs,
        'systolic_bp': sbps,
        'diastolic_bp': dbps,
        'spo2': spo2s,
        'respiratory_rate': rrs,
        'temperature': temps,
        'consciousness': consciousness,
        'supplemental_o2': supp_o2,
        'label_deterioration_6h': labels
    })
    return df

def generate_cohort(num_patients=250, output_file='data/patient_vitals_dataset.csv'):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    dfs = []
    trajectories = ['stable'] * 180 + ['sepsis'] * 30 + ['respiratory'] * 20 + ['cardiac'] * 20
    random.shuffle(trajectories)
    
    print(f"Generating cohort of {num_patients} patients...")
    for i in range(num_patients):
        traj = trajectories[i % len(trajectories)]
        pid = f"PAT-{i+1:04d}"
        df = generate_patient_trajectory(pid, hours=random.randint(24, 60), trajectory_type=traj)
        dfs.append(df)
        
    full_df = pd.concat(dfs, ignore_index=True)
    full_df.to_csv(output_file, index=False)
    print(f"Dataset generated: {len(full_df)} observations across {num_patients} patients.")
    print(f"Saved to: {output_file}")
    return full_df

if __name__ == '__main__':
    generate_cohort()
