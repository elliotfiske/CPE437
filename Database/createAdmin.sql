INSERT INTO Person (
    id, firstName, lastName, email,
    password, whenRegistered, termsAccepted, role
) VALUES (
    1, "Admin", "IAM", "Admin@11.com",
    "password", NOW(), NOW(), 2
);
