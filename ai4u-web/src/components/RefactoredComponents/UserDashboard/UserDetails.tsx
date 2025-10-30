import React from "react";
import { User } from "../../auth";
import { Card } from "../../shared/Card";
import Chip from "../../../commonComponents/Chip";

const UserDetails = ({ user }: { user: User }) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    avatar,
    is_active,
    emailVerified,
    login_count,
    created_at,
    updatedAt,
    last_login_at,
    auth_method,
    account_type,
  } = user;

  return (
    <Card>
      <div className="w-full flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
          {avatar ? (
            <img
              src={avatar}
              alt={`${first_name} ${last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-semibold text-gray-600 dark:text-gray-300">
              {first_name[0]}
              {last_name[0]}
            </span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {first_name} {last_name}
        </h2>
        <p className="text-sm  mb-3">{email}</p>

        {/* Status badges */}
        <div className="flex gap-2 mb-3">
          <Chip
            label={is_active ? "Active" : "Inactive"}
            variant={is_active ? "success" : "error"}
            className="text-xs"
          />

          <Chip
            label={emailVerified ? "Verified" : "Unverified"}
            variant={emailVerified ? "success" : "error"}
            className="text-xs"
          />
        </div>

        {/* Details */}
        <div className="w-full text-left text-sm  space-y-3">
          <p>
            <span className="font-bold">Auth Method:</span> {auth_method}
          </p>
          <p>
            <span className="font-bold">Account Type:</span> {account_type}
          </p>
          {phone && (
            <p>
              <span className="font-bold">Phone:</span> {phone}
            </p>
          )}

          <p>
            <span className="font-bold">Login Count:</span> {login_count}
          </p>
          <p>
            <span className="font-bold">Last Login:</span>{" "}
            {new Date(last_login_at).toLocaleString()}
          </p>
          <p>
            <span className="font-bold">Joined:</span>{" "}
            {new Date(created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default UserDetails;
