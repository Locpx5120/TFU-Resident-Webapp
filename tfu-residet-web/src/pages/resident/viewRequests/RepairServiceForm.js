import React from "react";
import { Box, MenuItem, TextField, Divider } from "@mui/material";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import { ASSIGNMENT, STAFF_PENDING } from "../../../constants/ApproveConstant";

const RepairServiceForm = ({ requestInfo, handleChange, kyThuats }) => {

  // Unified styling for fields
  const textFieldStyle = {
    mt: 0,
    backgroundColor: "white",
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
    },
  };

  const sectionStyle = {
    backgroundColor: "#fff",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    gap: 2,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "12px",
        mt: 3,
      }}
    >
      {/* Technician Information */}
      {<Box sx={sectionStyle}>
        <Box sx={{ display: "flex", gap: 2 }}>
          {requestInfo.staffName ? (
            <p style={{ width: '50%' }}>Tên kỹ thuật viên: <strong>{requestInfo.staffName}</strong></p>
          ) : (
            <TextField
              label="Tên kỹ thuật viên"
              fullWidth
              select
              value={requestInfo.staffId || ""}
              onChange={(e) => handleChange("staffId", e.target.value)}
              sx={textFieldStyle}
            >
              {kyThuats.map((kyThuat) => (
                <MenuItem key={kyThuat.id} value={kyThuat.id}>
                  {kyThuat.fullName}
                </MenuItem>
              ))}
            </TextField>
          )}

          {(Cookies.get("role") === "Resident" || Cookies.get("role") === "KiThuat") ? <p>
            Thời gian sửa chữa <strong>{requestInfo.startDate}</strong>
          </p> : <DatePicker
            placeholder="Thời gian sửa chữa"
            value={
              requestInfo.startDate
                ? dayjs(requestInfo.startDate, "MM/DD/YYYY HH:mm:ss")
                : null
            }
            onChange={(date) => handleChange("startDate", date)}
            style={{
              width: "100%",
              borderRadius: "8px",
              borderColor: "#d9d9d9",
              color: "#333",
            }}
            disabledDate={(current) => {
              return current && current < dayjs().startOf("day");
            }}
            disabled={Cookies.get("role") === "Resident" || Cookies.get("role") === "KiThuat"}
          />
          }
        </Box>
      </Box>}

      <Divider />

      {/* Notes Section */}
      <Box sx={sectionStyle}>
        <TextField
          label="Ghi chú của cư dân"
          multiline
          rows={3}
          fullWidth
          value={requestInfo.note || ""}
          onChange={(e) => handleChange("note", e.target.value)}
          sx={textFieldStyle}
        />

        {Cookies.get("role") !== "Resident" && <TextField
          label="Ghi chú của hành chính"
          multiline
          rows={3}
          fullWidth
          disabled={Cookies.get("role") === "Resident"}
          value={requestInfo.noteDetail || ""}
          onChange={(e) => handleChange("noteDetail", e.target.value)}
          sx={textFieldStyle}
        />}

        {(requestInfo.status === 7 || requestInfo.status === 1) && <TextField
          label="Đánh giá sau khi sửa chữa"
          multiline
          rows={3}
          fullWidth
          disabled={Cookies.get("role") !== "Resident" || requestInfo.status === 1}
          value={requestInfo.noteFeedbackCuDan || ""}
          onChange={(e) => handleChange("noteFeedbackCuDan", e.target.value)}
          sx={textFieldStyle}
        />}

        {Cookies.get("role") !== "Resident" && requestInfo.status === STAFF_PENDING && <TextField
          label="Ghi chú của kỹ thuật viên"
          multiline
          rows={3}
          fullWidth
          disabled
          value={requestInfo.noteKyThuat || ""}
          sx={{
            ...textFieldStyle,
            "& .MuiOutlinedInput-root": {
              borderColor: "#1976d2",
            },
          }}
        />}

        {/* {Cookies.get("role") !== "Resident" && <TextField
          label="Ghi chú của hành chính"
          multiline
          rows={3}
          fullWidth
          disabled={requestInfo.status < 6 || Cookies.get("role") === "Resident"}
          value={requestInfo.noteFeedbackHanhChinh || ""}
          onChange={(e) =>
            handleChange("noteFeedbackHanhChinh", e.target.value)
          }
          sx={textFieldStyle}
        />} */}
      </Box>
    </Box>
  );
};

export default RepairServiceForm;
