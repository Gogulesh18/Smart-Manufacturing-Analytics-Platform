CREATE TABLE machine_data (
    id BIGSERIAL PRIMARY KEY,
    air_temp FLOAT,
    process_temp FLOAT,
    rotational_speed INT,
    torque FLOAT,
    tool_wear INT,
    machine_failure INT,
    twf INT,
    hdf INT,
    pwf INT,
    osf INT,
    rnf INT,
    type_l INT,
    type_m INT
);