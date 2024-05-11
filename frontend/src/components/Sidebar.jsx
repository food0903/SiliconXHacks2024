import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import Avatar from '@mui/material/Avatar';
import { motion } from "framer-motion";
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import { Menu, MenuItem } from "@mui/material"
import { useState } from "react";
import { signOut } from "firebase/auth";

function Sidebar() {
    const [user] = useAuthState(auth);
    const [open, setOpen] = useState(false);


    const handleSignOut = async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error(error.message);
        }
      };

    return (
        <div className="w-[260px] bg-slate-100 h-screen">
            <div className="h-1/2 flex flex-col">
                <div>
                    Header
                </div>
            </div>
            <div className="h-1/2 flex flex-col px-1 justify-end items-center">
                <div className="w-[200px] h-[60px] relative mb-2">
                  
                    <Menu
                        id="basic-menu"
                        open={open}
                        onClose={() => setOpen(false)}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                        sx={{left: "100px", top: "-60px"}}
                        className="font-nunito"
                    >
                        <MenuItem sx={{fontFamily: "nunito"}} onClick={handleSignOut}>Logout</MenuItem>
                    </Menu>
          
                    <motion.div onClick={() => setOpen(true)} whileHover={{ scale: 1.03 }} className="w-full h-full bg-[#FFFFFF] hover:bg-slate-50 transition duration-100 ease-in-out drop-shadow-md rounded-2xl">
                        <div className="flex h-full w-full gap-x-2 items-center p-1 max-w-full">
                            <Avatar src={user.photoURL} sx={{ bgcolor: "purple" }}></Avatar>
                            <div className="flex flex-col flex-grow max-w-full">
                                <div className="flex">
                                    <div className="w-[110px] truncate">
                                        <span className="font-nunito font-bold text-sm">{user.displayName}</span>
                                    </div>
                                    <KeyboardArrowUpOutlinedIcon className="text-slate-600" />
                                </div>

                                <span className="font-nunito text-xs w-[120px] truncate">{user.email}</span>

                            </div>

                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

export default Sidebar;