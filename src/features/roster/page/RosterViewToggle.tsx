import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";

export const RosterViewToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = location.pathname.includes("monthly")
    ? "monthly"
    : "weekly";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    navigate(`/roster/${event.target.value}`);
  };

  return (
    <FormControl>
      <RadioGroup row value={currentView} onChange={handleChange}>
        <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
        <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
      </RadioGroup>
    </FormControl>
  );
};