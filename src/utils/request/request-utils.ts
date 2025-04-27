import axiosBean from ".";

export const signUp = () => {
  return axiosBean.post("/api/v1/auth/register", {
    email: "user@example.com",
    password: "MyPassword123",
    firstname: "John",
    lastname: "Doe",
    tenant_id: "tenant_12345",
  });
};
