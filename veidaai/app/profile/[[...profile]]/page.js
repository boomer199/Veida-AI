import React from "react";
import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import "./page.css";
import { useAuth } from "@clerk/nextjs";

export default async function Profile() {
    const { userId } = useAuth();
    const isAuth = !!userId;
    
    if (!isAuth) {
        redirect('/sign-in');
    }

    return (
        <div>
           
            <div className="profile-container">
                <UserProfile />
            </div>
        </div>
    );
}