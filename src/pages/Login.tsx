import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginStart, loginSuccess, loginFailure } from "../store/authSlice";
import { authService } from "../services/authService";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Login.css";

const loginSchema = z.object({
  identifier: z.string().nonempty("Email/Username is required"),
  password: z.string().nonempty("Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError("");
      dispatch(loginStart());

      const response = await authService.login({
        usernameOrEmail: data.identifier || "",
        password: data.password || "",
      });

      dispatch(
        loginSuccess({
          user: response.user,
          token: response.accessToken,
        }),
      );

      navigate("/");
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again.";
      setApiError(errorMessage);
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>EMS System</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* API Error */}
          {apiError && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {apiError}
              <button
                type="button"
                className="btn-close"
                onClick={() => setApiError("")}
              ></button>
            </div>
          )}

          {/* Email/Username Field */}
          <div className="mb-3">
            <label htmlFor="identifier" className="form-label">
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              className={`form-control ${errors.identifier ? "is-invalid" : ""}`}
              placeholder="Enter your email or username"
              {...register("identifier")}
            />
            {errors.identifier && (
              <div className="invalid-feedback d-block">
                {errors.identifier.message}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <div className="invalid-feedback d-block">
                {errors.password.message}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-muted">© 2026 EMS System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
