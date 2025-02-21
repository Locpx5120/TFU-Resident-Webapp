import React from "react";
import "../styles/Sidebar.css";
import { routeArray } from "../constants/routes";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import BadgeAvatars from "./Avatar";
import { Box } from "@mui/material";
import { invoiceAdd } from "../services/roomService";

const StyledUl = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const StyledLi = styled.li`
  margin-bottom: 10px;
  transition: all 0.3s ease;

  a {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    text-decoration: none;
    color: #333;
    background-color: #f8f8f8;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  &:hover a {
    background-color: #e6ffe6;
    transform: translateX(5px);
  }

  &.active a {
    background-color: #e6ffe6;
    color: #2e8b57;
    font-weight: bold;
  }

  span {
    margin-right: 10px;
  }
`;

const Sidebar = ({routes}) => {
  const location = useLocation();

  const callApi = async () => {
    await invoiceAdd();
  }

  return (
    <div className="sidebar">
      <div className="profile">
        {/* <Box className="profile-img">
          <BadgeAvatars src="https://avatar-ex-swe.nixcdn.com/song/2020/08/06/6/0/8/0/1596682420038.jpg" />
        </Box> */}
        {/* <h3>Hệ thống Quản lý Tòa nhà TFU</h3> */}
      </div>
      <nav style={{marginBottom: 40}}>
        <StyledUl>
          {routes.map((item, i) => (
            <StyledLi
              key={i}
              className={location.pathname === item.route ? "active" : ""}
            >
              <Link to={item.route} onClick={() => {
                if( '/thanh-toan-dich-vu' === item.route) {
                  callApi();
                }
              }}>
                <span>{item.icon}</span>
                {item.routeName}
              </Link>
            </StyledLi>
          ))}
        </StyledUl>
      </nav>
    </div>
  );
};

export default Sidebar;