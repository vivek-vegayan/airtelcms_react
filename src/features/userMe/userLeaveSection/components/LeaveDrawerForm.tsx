// import {
//   Drawer,
//   Box,
//   Typography,
//   Stack,
//   TextField,
//   Button,
//   MenuItem,
// } from "@mui/material";
// import { useState } from "react";
// import { useApplyLeaveMutation, useGetLeaveTypesQuery } from "../api/leave.api";

// interface Props {
//   open: boolean;
//   onClose: () => void;
// }

// export default function LeaveDrawerForm({ open, onClose }: Props) {
//   const [applyLeave] = useApplyLeaveMutation();
//   const { data: leaveTypes = [], isLoading } = useGetLeaveTypesQuery();

//   const [form, setForm] = useState({
//     leaveType: "",
//     startDate: "",
//     endDate: "",
//     reason: "",
//   });

//   const handleSubmit = async () => {
//     await applyLeave(form);
//     onClose();
//   };

//   return (
//     <Drawer anchor="right" open={open} onClose={onClose}>
//       <Box width={400} p={3}>
//         <Typography variant="h6" mb={3}>
//           Apply Leave
//         </Typography>

//         <Stack spacing={2}>
//           <TextField
//             select
//             label="Leave Type"
//             value={form.leaveType}
//             onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
//           >
//             {isLoading ? (
//               <MenuItem disabled>Loading...</MenuItem>
//             ) : (
//               leaveTypes.map((item) => (
//                 <MenuItem key={item.leaveType} value={item.leaveType}>
//                   {item.leaveType}
//                 </MenuItem>
//               ))
//             )}
//           </TextField>
//           {/* <TextField
//             select
//             label="Leave Type"
//             value={form.leaveType}
//             onChange={(e) =>
//               setForm({ ...form, leaveType: e.target.value })
//             }
//           >
//             <MenuItem value="CASUAL">Casual</MenuItem>
//             <MenuItem value="SICK">Sick</MenuItem>
//           </TextField> */}

//           <TextField
//             type="date"
//             label="Start Date"
//             InputLabelProps={{ shrink: true }}
//             onChange={(e) => setForm({ ...form, startDate: e.target.value })}
//           />

//           <TextField
//             type="date"
//             label="End Date"
//             InputLabelProps={{ shrink: true }}
//             onChange={(e) => setForm({ ...form, endDate: e.target.value })}
//           />

//           <TextField
//             label="Reason"
//             multiline
//             rows={3}
//             onChange={(e) => setForm({ ...form, reason: e.target.value })}
//           />

//           <Button variant="contained" onClick={handleSubmit}>
//             Submit
//           </Button>
//         </Stack>
//       </Box>
//     </Drawer>
//   );
// }
