import React, { useContext, useState } from "react";
import { Container, Row, Col, Form, FormGroup, Button } from "react-bootstrap";
import '../styles/login.css';
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { authService } from "../services/authService";
import Cookies from "js-cookie";

const LoginBuilding = () => {
    const { buildingId } = useParams(); 
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
        buildingId
    });

    const { dispatch } = useContext(authService);
    const navigate = useNavigate();

    // Hàm thay đổi giá trị input
    const handleChange = e => {
        setCredentials(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    // Hàm xử lý đăng nhập
    const handleClick = async e => {
        e.preventDefault();
        dispatch({ type: 'LOGIN_START' });

        try {
            const res = await fetch('https://localhost:7082/api/auth/token', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'buildingPermalink': buildingId,
                },
                body: JSON.stringify(credentials)
            })

            const result = await res.json();
            if (!res.ok) alert(result.message)
            if (result.data && result.data.token) {
                Cookies.set('accessToken', result.data.token, { expires: 1 });
                Cookies.set('buildingID', buildingId, { expires: 1 });
                dispatch({ type: "LOGIN_SUCCESS", payload: result.data.user });

                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công',
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6',
                    timer: 1500
                });

                navigate('/');
            }
        } catch (error) {
            dispatch({ type: "LOGIN_FAILURE", payload: error.response?.data?.message || error.message });

            Swal.fire({
                icon: 'error',
                title: 'Đăng nhập thất bại',
                text: error.response?.data?.message || error.message,
                confirmButtonColor: '#3085d6',
            });
        }
    };


    return (
        <section className="login-section">
            <Container>
                <Row>
                    <Col lg='8' className='m-auto'>
                        <div className="login-container d-flex justify-content-between">

                            <div className="login-form">
                                <h2>Đăng nhập</h2>

                                <Form onSubmit={handleClick}>
                                    <FormGroup>
                                        <input type="email" placeholder='Email' id='email' onChange={handleChange} required />
                                    </FormGroup>
                                    <FormGroup>
                                        <input type="password" placeholder='Mật khẩu' id='password' onChange={handleChange} required />
                                    </FormGroup>
                                    <Button className='btn primary-btn' type='submit'>Đăng nhập</Button>
                                </Form>
                                <p><Link to='/forgot-password'>Quên mật khẩu?</Link></p>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default LoginBuilding;
