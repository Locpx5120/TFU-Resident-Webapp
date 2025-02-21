import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    TablePagination,
    Select,
    MenuItem,
    Typography,
    Button,
} from '@mui/material';
import TableCustom from '../../../components/Table';
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { Link, useParams } from 'react-router-dom';

const AccountantPageDetail = () => {
    const { id } = useParams();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [payments, setPayments] = useState([]);
    const [roomsData, setRoomsData] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const buildingID = Cookies.get("buildingID");

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch("https://localhost:7082/api/apartment-services/unpaid-details", {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${Cookies.get("accessToken")}`,
                        'content-type': 'application/json',
                        'buildingPermalink': Cookies.get('buildingID'),
                    },
                    body: JSON.stringify({
                        apartmentId: id,
                        serviceType: "",
                    })
                });
                const data = await response.json();
                setRoomsData(data);
            } catch (error) {
                Swal.fire('Thất bại', 'Xóa thất bại!', 'error');
            }
        }
        fetchRooms();
    }, [])

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedRows = useMemo(() => {
        return roomsData.services;
    }, [page, rowsPerPage, roomsData,]);

    return (
        <section className="content service">
            <QRCodeModal isOpen={modalIsOpen} onRequestClose={closeModal} />
            <Box>
                <Typography variant="h6">Chi tiết thanh toán dịch vụ phòng</Typography>
            </Box>
            <Card sx={{ maxHeight: "850px", marginTop: "30px" }}>
                <TableCustom
                    columns={columnData}
                    rows={paginatedRows}
                    onRowClick={() => { }}
                />
                <TablePagination
                    component="div"
                    count={paginatedRows?.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <h1>Tổng tiền cần thanh toán:  {roomsData?.totalAmount}</h1>
                    <Button variant="primary" onClick={openModal}>Thanh toán QR code</Button>
                </div>
            </Card>
        </section>
    );
};

const columnData = [
    { name: "Tên dịch vụ", align: "left", esName: "serviceName" },
    { name: "Số lượng/m2", align: "left", esName: "quantityOrArea" },
    { name: "Giá tiền", align: "left", esName: "unitPrice" },
    { name: "Tổng tiền", align: "left", esName: "totalPrice" },
];

export default AccountantPageDetail;