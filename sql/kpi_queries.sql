SELECT 
ROUND((SUM(machine_failure)::decimal / COUNT(*)) * 100, 2) AS failure_rate
FROM machine_data;

SELECT *
FROM machine_data
WHERE torque > 50
AND tool_wear > 200
AND machine_failure = 1;

SELECT
    ROUND(AVG(torque)::numeric,2) AS avg_torque,
    ROUND(AVG(tool_wear)::numeric,2) AS avg_tool_wear,
    ROUND(AVG(rotational_speed)::numeric,2) AS avg_rotational_speed,
    ROUND(AVG(air_temp)::numeric,2) AS avg_air_temp,
    ROUND(AVG(process_temp)::numeric,2) AS avg_process_temp
FROM machine_data;

SELECT
    SUM(twf) AS tool_wear_failures,
    SUM(hdf) AS heat_failures,
    SUM(pwf) AS power_failures,
    SUM(osf) AS overstrain_failures,
    SUM(rnf) AS random_failures
FROM machine_data;

CREATE VIEW manufacturing_kpis AS
SELECT
    COUNT(*) AS total_operations,
    ROUND((SUM(machine_failure)::decimal / COUNT(*)) * 100, 2) AS failure_rate,
    ROUND(AVG(torque)::numeric,2) AS avg_torque,
    ROUND(AVG(tool_wear)::numeric,2) AS avg_tool_wear,
    ROUND(AVG(rotational_speed)::numeric,2) AS avg_rotational_speed
FROM machine_data;