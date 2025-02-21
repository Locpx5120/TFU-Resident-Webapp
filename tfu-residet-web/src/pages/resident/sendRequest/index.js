import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { DatePicker, message } from "antd";
import moment from "moment/moment";
import { addMember, getServiceName } from "../../../services/apartmentService";
import { listAllPackage } from "../../../services/PackageService";
import {
  addRepairReport,
  addVehicle,
  listCategory,
} from "../../../services/vehicleService";
import { useLocation } from "react-router-dom";
import { baoCaoSuaChua, themThanhVien, vehicleCode } from "../../../constants";
import {
  getApartmentByBuilding,
  GetBuildingsByUser,
} from "../../../services/buildingService";
import * as yup from 'yup';
import dayjs from 'dayjs'
const SendRequest = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const agentType = queryParams.get("agentType");
  const residentId = Cookies.get("residentId");

  const [serviceNames, setServiceName] = useState(agentType || "");
  const [serviceTypes, setServiceTypes] = useState("");

  const [serviceTypesArr, setServiceTypesArr] = useState([]);
  const [packageArr, setPackagesArr] = useState([]);
  const [serviceNameArr, setServiceNameArr] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [apartment, setApartment] = useState("");
  const initalRequet =
    serviceTypes === themThanhVien
      ? {
        serviceId: "",
        note: "",
        name: "",
        phone: "",
        email: "",
        birthday: "",
      }
      : serviceTypes === baoCaoSuaChua
        ? {
          ownerName: "",
          ownerPhone: "",
          ownerEmail: "",
          technicianName: "",
          technicianPhone: "",
          startDate: null,
          cost: "",
          note: "",
        }
        : {
          serviceId: "",
          vehicleType: "",
          licensePlate: "",
          packageServiceId: "",
          note: "",
          apartmentId: "",
          startDate: null, // Đặt mặc định là null
          unit: "",
          unitPrice: 0,
          price: 0,
        };
  const [requests, setRequests] = useState([initalRequet]);
  const [building, setBuilding] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [buildingsData, packagesData, serviceTypesData] =
          await Promise.all([
            GetBuildingsByUser(),
            listAllPackage(),
            listCategory(),
          ]);
        setBuildings(buildingsData.data);
        setPackagesArr(packagesData.data);
        setServiceTypesArr(serviceTypesData.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (serviceTypes) {
      getServiceName(serviceTypes).then((res) =>
        setServiceNameArr(res?.data || [])
      );
    }
  }, [serviceTypes]);

  useEffect(() => {
    if (building) {
      getApartmentByBuilding(building).then((res) =>
        setApartments(res?.data || [])
      );
    }
  }, [building]);

  const handleChange = (index, field, value) => {
    setRequests((prev) =>
      prev.map((req, i) => {
        if (i === index) {
          const updatedRequest = { ...req };

          if (field === "startDate") {
            updatedRequest[field] = value; // Lưu giá trị ngày hoặc null
          } else if (field === "serviceId" && index === 0) {
            updatedRequest[field] = value;
            setServiceTypes(value); // Giữ logic dịch vụ
          } else {
            updatedRequest[field] = value;
          }
          updatedRequest.price = calculatePrice(
            updatedRequest.serviceId,
            updatedRequest.packageServiceId,
            updatedRequest.startDate
          );
          return updatedRequest;
        }
        return req;
      })
    );
  };

  const handleChangeServiceName = (index, field, value) => {
    handleChange(index, field, value);
    setServiceName(value);
  };

  const handleAddRequest = () => {
    setRequests((prev) => [
      ...prev,
      {
        ...getInitialRequest(serviceTypes),
        serviceId: prev[0].serviceId,
        startDate: null,
      },
    ]);
  };

  const handleRemoveRequest = (index) => {
    setRequests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      let data;
      if (serviceTypes === themThanhVien) {
        data = await submitMemberRequest();
      } else if (serviceTypes === baoCaoSuaChua) {
        data = await submitRepairRequest();
      } else {
        data = await submitVehicleRequest();
      }

      if (data.code === 200) {
        Swal.fire("Thành công", "Đã gửi đơn thành công!", "success");
        resetForm();
      } else {
        Swal.fire(
          "Thất bại",
          data.data[0]?.message || "Gửi đơn thất bại!",
          "error"
        );
      }
    } catch (error) {
      Swal.fire("Lỗi", "Gửi đơn thất bại", "error");
    }
  };

  const resetForm = () => {
    setRequests([getInitialRequest(serviceTypes)]);
  };

  const getInitialRequest = (type) => {
    switch (type) {
      case themThanhVien:
        return {
          serviceId: "",
          note: "",
          name: "",
          phone: "",
          email: "",
          birthday: "",
        };
      case baoCaoSuaChua:
        return {
          ownerName: "",
          ownerPhone: "",
          ownerEmail: "",
          technicianName: "",
          technicianPhone: "",
          startDate: null,
          cost: "",
          note: "",
        };
      default:
        return {
          serviceId: "",
          vehicleType: "",
          licensePlate: "",
          packageServiceId: "",
          note: "",
          apartmentId: "",
          startDate: "",
          unit: "",
          unitPrice: 0,
          price: 0,
        };
    }
  };
  const submitMemberRequest = async () => {
    const services = {
      apartmentId: apartment,
      serviceId: serviceNames,
      members: requests.map(({ name, email, birthday, phone, note }) => ({
        name,
        email,
        birthday: new Date(birthday),
        phone,
        note,
      })),
    };
    if (services.members.some((mem) => !validateEmail(mem.email))) {
      throw new Error("Invalid email");
    }
    return await addMember(services);
  };

  const submitRepairRequest = async () => {
    const services = requests.map((item) => ({
      ...item,
      apartmentId: apartment,
      serviceId: serviceNames,
      residentId,
    }));
    return await addRepairReport({ services });
  };

  const submitVehicleRequest = async () => {
    const services = requests.map((request) => ({
      ...request,
      startDate: moment(request.startDate, "YYYY-MM-DD").format("YYYY-MM-DD"), // Chuẩn hóa ngày
      residentId,
      serviceId: serviceNames,
      apartmentId: apartment,
    }));
    return await addVehicle({ services });
  };


  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatCurrencyVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  }

  const packageDiscount = {
    "153a51b2-3b37-435f-b59e-cd76476a7459": 10, // Gói tiêu chuẩn (10% giảm giá)
    "520e4b8e-8592-4e2d-b2fd-f3a804dee6e9": 0, // Gói mặc định (không giảm giá)
    "520e4b8e-8592-4e2d-b2fd-f9a804dee6e9": 5  // Gói cơ bản (5% giảm giá)
  };

  const calculatePrice = useCallback((serviceId, packageId, startDate) => {
    if (!serviceId || !packageId) return 0;

    const service = serviceNameArr.find(item => item.id === serviceNames);
    const packageMonth = packageArr.find(item => item.id === packageId).durationInMonth;
    if (!service) return 0;

    const servicePrice = service.unitPrice;
    const packageMultiplier = (packageDiscount[packageId] || 0) / 100;
    if (startDate === null || startDate === undefined || startDate === '')
      return 0;
    const initialDate = new Date(startDate);
    const newDate = new Date(startDate);
    newDate.setMonth(newDate.getMonth() + packageMonth); // Add 6 months

    // Calculate difference in days
    const timeDifference = newDate - initialDate;
    const duration = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    let price = servicePrice * (duration <= 0 ? 1 : duration);
    price -= price * packageMultiplier;
    return price;
  }, [serviceNameArr, packageDiscount]);

  const [fieldErrors, setFieldErrors] = useState({})
  const validateForm = async (formData, fieldName) => {
    if (!validateSchema) return true;
    try {
      if (fieldName) {
        if (!Object.keys(validateSchema.fields).some(x => x === fieldName)) {
          setFieldErrors(prev => ({
            ...prev,
            [fieldName]: undefined
          }))
          return;
        }
        await validateSchema.validateAt(fieldName, formData, { abortEarly: false, disableStackTrace: true });
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: undefined
        }))
      } else {
        await validateSchema.validate(formData, { abortEarly: false, disableStackTrace: true });
        setFieldErrors({})
      }

      return true;
    } catch (error) {
      setFieldErrors(JSON.parse(JSON.stringify(error.inner)).reduce((prev, nxt) => {
        if (nxt.message) {
          prev[nxt.path] = nxt.message;

        }
        return prev;
      }, {}))
      return false;

    }
  }
  const validateSchema = yup.object({

  })
  const renderMemberFields = (request, index) => (
    <>
      <TextField
        label="Tên thành viên"
        value={request.name}
        onChange={(e) => handleChange(index, "name", e.target.value)}
        required
        error={fieldErrors.name}
        helperText={fieldErrors.name}
        sx={formStyles.textField}
      />
      <TextField
        label="Số điện thoại"
        value={request.phone}
        onChange={(e) => handleChange(index, "phone", e.target.value)}
        required
        error={fieldErrors.phone}
        helperText={fieldErrors.phone}
        sx={formStyles.textField}
      />
      <TextField
        label="Email"
        type="email"
        value={request.email}
        onChange={(e) => handleChange(index, "email", e.target.value)}
        required
        error={fieldErrors.email}
        helperText={fieldErrors.email}
        sx={formStyles.textField}
      />
      <DatePicker
        placeholder="Ngày sinh"
        value={request.birthday ? moment(request.birthday) : null}
        onChange={(date, dateString) =>
          handleChange(index, "birthday", dateString)
        }
        style={formStyles.datePicker}
      />
    </>
  );

  const renderVehicleFields = (request, index) => (
    <>
      <TextField
        label="Loại xe"
        value={request.vehicleType}
        onChange={(e) => handleChange(index, "vehicleType", e.target.value)}
        required
        error={fieldErrors.vehicleType}
        helperText={fieldErrors.vehicleType}
        sx={formStyles.textField}
      />
      <TextField
        label="Biển số xe"
        value={request.licensePlate}
        onChange={(e) => handleChange(index, "licensePlate", e.target.value)}
        required
        error={fieldErrors.licensePlate}
        helperText={fieldErrors.licensePlate}
        sx={formStyles.textField}
      />
      <FormControl sx={formStyles.selectField}>
        <InputLabel>Gói</InputLabel>
        <Select
          value={request.packageServiceId}
          error={fieldErrors.packageServiceId}
          helperText={fieldErrors.packageServiceId}
          onChange={(e) => handleChange(index, "packageServiceId", e.target.value)}
          required
        >
          {packageArr.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DatePicker
        placeholder="Ngày gửi xe"
        disabledDate={(v) => v.isBefore(dayjs(), 'day')}
        value={request.startDate ? moment(request.startDate, "YYYY-MM-DD") : null}
        onChange={(date) => {
          if (date) {
            const localDate = moment(date.toDate()).format("YYYY-MM-DD");
            handleChange(index, "startDate", localDate);
          } else {
            handleChange(index, "startDate", null);
          }
        }}
        required
        style={formStyles.datePicker}
      />
      <Typography sx={{ width: '100%', marginTop: 2 }}>
        Phí dịch vụ: <strong>{formatCurrencyVND(request.price || 0)}</strong>
      </Typography>
    </>
  );

  const renderRepairFields = (request, index) => <></>;

  const formStyles = {
    container: {
      padding: "24px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    section: {
      marginBottom: "32px",
    },
    selectField: {
      width: "48%",
      marginRight: "2%",
      marginBottom: "16px",
    },
    textField: {
      width: "48%",
      marginRight: "2%",
      marginBottom: "16px",
    },
    datePicker: {
      width: "48%",
      marginRight: "2%",
      marginBottom: "16px",
    },
    fullWidthField: {
      width: "98%",
      marginBottom: "16px",
    },
    actionButton: {
      minWidth: "40px",
      height: "40px",
      padding: "0",
      marginLeft: "8px",
    },
  };

  return (
    <Box className="content" sx={formStyles.container}>
      <Box sx={formStyles.section}>
        <Typography variant="h6" gutterBottom>
          Thông tin căn hộ
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <FormControl sx={formStyles.selectField}>
            <InputLabel>Toà nhà</InputLabel>
            <Select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              required
            >
              {buildings.map((building) => (
                <MenuItem key={building.id} value={building.id}>
                  {building.buildingName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={formStyles.selectField}>
            <InputLabel>Căn hộ</InputLabel>
            <Select
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              required
              disabled={apartments.length < 1}
            >
              {apartments.map((apt) => (
                <MenuItem key={apt.id} value={apt.id}>
                  {apt.roomNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={formStyles.section}>
        <Typography variant="h6" gutterBottom>
          Thông tin đơn
        </Typography>
        <form onSubmit={handleSubmit}>
          {requests.map((request, index) => (
            <Box
              key={index}
              sx={{
                padding: "16px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <FormControl sx={formStyles.selectField}>
                  <InputLabel>Loại dịch vụ</InputLabel>
                  <Select
                    value={request.serviceId}
                    onChange={(e) => {
                      handleChange(index, "serviceId", e.target.value);
                    }}
                    required
                    error={fieldErrors.serviceId}
                    helperText={fieldErrors.serviceId}
                    disabled={index !== 0}
                  >
                    {serviceTypesArr.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {request.serviceId && (
                  <FormControl sx={formStyles.selectField}>
                    <InputLabel>Tên dịch vụ</InputLabel>
                    <Select
                      value={request.serviceName}
                      onChange={(e) =>
                        handleChangeServiceName(
                          index,
                          "serviceName",
                          e.target.value
                        )
                      }
                      required
                      disabled={!serviceTypes}
                    >
                      {serviceNameArr.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.serviceName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {/* <Box sx={{ display: "flex", alignItems: "center" }}>
                      {index === 0 ? (
                          <Button
                              variant="contained"
                              color="primary"
                              onClick={handleAddRequest}
                              sx={formStyles.actionButton}
                          >
                            +
                          </Button>
                      ) : (
                          <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleRemoveRequest(index)}
                              sx={formStyles.actionButton}
                          >
                            -
                          </Button>
                      )}
                    </Box> */}
              </Box>

              <Box sx={{ marginTop: 2 }}>
                {request.serviceId === themThanhVien &&
                  renderMemberFields(request, index)}
                {request.serviceId === baoCaoSuaChua &&
                  renderRepairFields(request, index)}
                {request.serviceId === vehicleCode &&
                  renderVehicleFields(request, index)}
              </Box>

              <TextField
                label="Ghi chú"
                multiline
                rows={2}
                value={request.note}
                onChange={(e) => handleChange(index, "note", e.target.value)}
                sx={formStyles.fullWidthField}
              />
            </Box>
          ))}

          <Box sx={{ textAlign: "right", marginTop: "24px" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
            >
              Gửi đơn
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default SendRequest;

