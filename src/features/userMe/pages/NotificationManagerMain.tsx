import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import TopActionsSection from "../notification-manager/components/TopActionsSection";
import NotificationDialog from "../notification-manager/components/NotificationDialog";
import NotificationManagementTable from "../notification-manager/components/NotificationManagementTable";
import CommonContainer from "../../../components/common/CommonContainer";

const NotificationManagerMain: React.FC = () => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <CommonContainer>
      <TopActionsSection onAddNewNotification={() => setOpenDialog(true)} />
      <NotificationManagementTable />
      <NotificationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </CommonContainer>
  );
};

export default NotificationManagerMain;
