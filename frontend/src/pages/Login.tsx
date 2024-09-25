import React, { useEffect, useState } from "react";
import {
	ErrorMessage,
	Field,
	Formik,
	FormikHelpers,
	FormikValues,
} from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";

interface FormValues {
	email: string;
	password: string;
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .max(255, "Email cannot exceed 255 characters")
    .email("Invalid email")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .max(60, "Password cannot exceed 60 characters")
    .required("Password is required"),
});

const API_URL = "http://localhost:3000";

const Login: React.FC = () => {

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuth = () => {
    fetch(`${API_URL}/auth/check`, {
      method: "GET",
      credentials: "include",
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      setIsAuthenticated(data.authenticated);
    })
    .catch(() => {
      setIsAuthenticated(false);
    })
    .finally(() => {
      setLoading(false);
    });
  };

	const initialValues: FormValues = {
		email: "",
		password: "",
	};

  const login = (values: FormikValues) => {
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
      }),
      credentials: "include",
    }).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          console.log(data);
          navigate("/");
        });
      }
    })
  }

	const handleSubmit = (
		values: FormikValues,
		{ setSubmitting }: FormikHelpers<FormValues>
	) => {
		setTimeout(() => {
			login(values);
			setSubmitting(false);
		}, 500);
	};

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/'); // Redirige vers la page d'accueil si l'utilisateur est authentifié
    }
  }, [loading, isAuthenticated, navigate]);

	return (
		<main>
			<h1>Login</h1>
			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
			>
				{({ isSubmitting, errors, handleSubmit }) => (
					<form onSubmit={handleSubmit}>
						<div>
							<label htmlFor="email">
								Email
								<Field type="email" name="email" id="email" />
								<ErrorMessage name="email" component="div" />
							</label>
						</div>
						<div>
							<label htmlFor="password">
								Password
								<Field type="password" name="password" id="password" />
								<ErrorMessage name="password" component="div" />
							</label>
						</div>
						<button className={isSubmitting ? "text-red-500" : ""} type="submit">
							Submit
						</button>
					</form>
				)}
			</Formik>
		</main>
	);
};

export default Login;
