import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  TablePagination,
  Typography,
  Button,
  MenuItem,
  Box,
  Select,
  CircularProgress,
} from "@mui/material";
import TableCustom from "../../../components/Table";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getDetailVehicle } from "../../../services/vehicleService";
import { getBuilding } from "../../../services/residentService";
import dayjs from "dayjs";
import { Calendar } from "primereact/calendar";
import { getServices } from "../../../services/apartmentService";
import {
  getStatusLabel,
  statusArray,
} from "../../../constants/ApproveConstant";
import { GetBuildingsByUser } from "../../../services/buildingService";
import { GetBuildingsForNews } from "../../../services/NewsService";

const ViewRequests = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const residentId = Cookies.get("residentId");
  const buildingID = Cookies.get("buildingID");
  const [buildings, setBuildings] = useState([]);
  const [selectedService, setSelectedService] = useState({ id: -1, name: "-1" });
  const [selectedBuilding, setSelectedBuilding] = useState({ id: -1, name: "-1" });
  const [selectedStatus, setSelectedStatus] = useState({ id: -1, name: "-1" });
  const [dates, setDates] = useState([]);
  const [typeData, setTypeData] = useState([]);

  const handleDateChange = (e) => {
    setSelectedService((prev) => ({
      ...prev,
      startDateFrom: e[0],
      startDateTo: e[1] || e[0],
    }));
  };

  const handleServiceChange = (event) => {
    setSelectedService((prev) => ({
      ...prev,
      name: event.target.value,
    }));
    setPage(0);
  };

  const handleBuildingChange = (event) => {
    setSelectedBuilding((prev) => ({
      ...prev,
      name: event.target.value,
    }));
    setPage(0);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus((prev) => ({
      ...prev,
      name: event.target.value,
    }));
    setPage(0);
  };

  const handleServiceSelect = (service) => {
    setSelectedService({ id: service.id, name: service.serviceName });
  };

  const handleBuildingSelect = (building) => {
    setSelectedBuilding({ id: building.id, name: building.buildingName });
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus({ id: status.value, name: status.label });
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await GetBuildingsForNews();
      const data = await getBuilding(
        "914b90f1-1d0d-4039-9084-47c10783e058",
        buildingID
      );
      const apartmentIds = data?.data || [];
      const responses = await Promise.all(
        apartmentIds.map(async (item) => {
          const vehicleDetails = await getDetailVehicle(item.apartmentId);
          return {
            ...item, // Lưu trữ tất cả thông tin từ item
            vehicleDetails: vehicleDetails || {}, // Đảm bảo không bị undefined/null
          };
        })
      );
      const allItems = responses
        .flatMap((response) =>
          (response.vehicleDetails?.data || []).map((item) => ({
            ...item, // Sao chép tất cả dữ liệu từ item
            createdDate: item.createdDate
              ? dayjs(item.createdDate).format("YYYY-MM-DD")
              : null,
            processedDate: item.processedDate
              ? dayjs(item.processedDate).format("YYYY-MM-DD")
              : null,
            buildingName: response.buildingName, // Truyền buildingName từ response
            roomNumber: response.roomNumber, // Truyền buildingName từ response
          }))
        )
        // .filter(item => item.createdDate) // Loại bỏ các mục không có createdDate
        .sort((a, b) => dayjs(b.createdDate).diff(dayjs(a.createdDate))); // Sắp xếp giảm dần theo createdDate

      const serviceTypes = await getServices();
      setTypeData(serviceTypes?.data || []);
      setBuildings(res?.data || []);
      setRequests(allItems);
      setFilteredRequests(allItems);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [buildingID]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const applyFilters = () => {
      setIsLoading(true);
      let filtered = [...requests];
      
      if (selectedService.name && selectedService.name != '-1') {
        filtered = filtered.filter(
          (request) => request.serviceName === selectedService.name
        );
      }

      if (selectedBuilding.name && selectedBuilding.name != '-1') {
       
        filtered = filtered.filter((request) => {
          return request.buildingName === selectedBuilding.name;
        });
      }
      if ((selectedStatus.id || selectedStatus.id == 0) && selectedStatus.id !== -1) {
        filtered = filtered.filter(
          (request) => request.status == selectedStatus.id
        );
      }

      if (dates[0] && dates[1]) {
        const startDate = dayjs(dates[0]);
        const endDate = dayjs(dates[1]);
        filtered = filtered.filter((request) => {
          const createdDate = dayjs(request.createdDate, "DD/MM/YYYY");
          return (
            createdDate.isAfter(startDate) ||
            (createdDate.isSame(startDate, "day") &&
              (createdDate.isBefore(endDate) ||
                createdDate.isSame(endDate, "day")))
          );
        });
      }

      setFilteredRequests(filtered);
      setIsLoading(false);
    };

    const debounce = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(debounce);
  }, [
    selectedService.id,
    selectedBuilding.id,
    selectedStatus.id,
    dates,
    requests,
  ]);

  const resetForm = () => {
    setDates([]);
    setSelectedService({ id: 0, name: "-1" });
    setSelectedBuilding({ id: 0, name: "-1" });
    setSelectedStatus({ id: 0, name: "-1" });
    setFilteredRequests(requests);
  };

  const columns = [
    { esName: "buildingName", name: "Tòa nhà" },
    { esName: "roomNumber", name: "Phòng" },
    { esName: "serviceName", name: "Tên dịch vụ" },
    { esName: "createdDate", name: "Ngày tạo" },
    { esName: "processedDate", name: "Ngày xử lý" },
    { esName: "status", name: "Trạng thái" },
    { esName: "details", name: "Chi tiết" },
  ];

  const paginatedRows = filteredRequests
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((request) => ({
      ...request,
      status: getStatusLabel(request.status),
      details: (
        <Button
          variant="outlined"
          onClick={() =>
            navigate(
              `/xem-chi-tiet-don/${request.serviceContractId}&purpose=${request.purpose}`,
              { state: { request } }
            )
          }
        >
          Xem
        </Button>
      ),
    }));

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card className="content" sx={{ maxHeight: "800px", marginTop: "30px" }}>
      <Box>
        <Typography variant="h6">Danh sách yêu cầu</Typography>
        <Select
          value={selectedService.name}
          onChange={handleServiceChange}
          displayEmpty
          name="id"
          sx={{ margin: "20px 10px 10px" }}
        >
          <MenuItem value="-1"
           onClick={() => handleServiceSelect({id: -1, serviceName: '-1'})}
          >Tất cả dịch vụ</MenuItem>
          {typeData.map((service) => (
            <MenuItem
              key={service.id}
              value={service.serviceName}
              onClick={() => handleServiceSelect(service)}
            >
              {service.serviceName}
            </MenuItem>
          ))}
        </Select>
        <Select
          value={selectedBuilding.name}
          onChange={handleBuildingChange}
          displayEmpty
          name="id"
          sx={{ margin: "20px 10px 10px" }}
        >
          <MenuItem value="-1"
          onClick={() => handleBuildingSelect({id: -1, buildingName: '-1'})}
          >Tất cả toà nhà</MenuItem>
          {buildings.map((building) => (
            <MenuItem
              key={building.id}
              value={building.buildingName}
              onClick={() => handleBuildingSelect(building)}
            >
              {building.buildingName}
            </MenuItem>
          ))}
        </Select>
        <Calendar
          value={dates}
          onChange={(e) => {
            setDates(e.value);
            handleDateChange(e.value);
          }}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          placeholder="Chọn khoảng thời gian"
          dateFormat="dd/mm/yy"
        />
        <Select
          value={selectedStatus.name}
          onChange={handleStatusChange}
          displayEmpty
          name="id"
          sx={{ margin: "20px 10px 10px" }}
        >
          <MenuItem value="-1"
           onClick={() => handleStatusSelect({value: -1, label: '-1'})}
          >Tất cả trạng thái</MenuItem>
          {statusArray.map((status) => (
            <MenuItem
              key={status.value}
              value={status.label}
              onClick={() => handleStatusSelect(status)}
            >
              {status.label}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="outlined"
          className="ml-2"
          color="primary"
          size="large"
          onClick={resetForm}
        >
          Đặt lại
        </Button>
      </Box>

      <Typography variant="h5" sx={{ padding: "16px" }}>
        Xem Đơn
      </Typography>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableCustom columns={columns} rows={paginatedRows} />
          <TablePagination
            component="div"
            count={filteredRequests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
    </Card>
  );
};

export default ViewRequests;
