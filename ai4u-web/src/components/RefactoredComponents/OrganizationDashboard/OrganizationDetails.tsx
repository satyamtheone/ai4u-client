import Chip from "../../../commonComponents/Chip";
import { Organization } from "../../../services/api/OrganizationService";
import { Card } from "../../shared/Card";

const OrganizationDetails = ({ org }: { org: Organization }) => {
  return (
    <Card>
      <div className=" w-full flex flex-col gap-4 ">
        {/* Logo / initials */}
        <div className=" flex justify-center">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={`${org.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-gray-600 dark:text-gray-300">
                    {org.name[0]}
                    {org.name[1]}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {org.name}
                </h2>
                <p className="text-xs text-gray-500 truncate">/{org.slug}</p>
              </div>
            </div>

            {/* Badges */}

            <div className="flex gap-2">
              <Chip
                label={org.is_active ? "Active" : "Inactive"}
                variant={org.is_active ? "success" : "error"}
                className="text-xs"
              />
              <Chip
                label={`${org.subscription_plan} · ${org.subscription_status}`}
                variant={org.is_active ? "success" : "error"}
                className="text-xs"
              />
              <Chip
                label={org.industry}
                variant="warning"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {org.description && (
          <p className="text-sm capitalize ">{org.description}</p>
        )}

        {/* Website */}
        {org.website && (
          <a
            href={org.website}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm underline underline-offset-4 text-blue-600 dark:text-blue-400 "
          >
            Visit website
          </a>
        )}

        {/* Meta */}
        <div className="text-sm  space-y-2">
          <p>
            <span className="font-bold">Max Users:</span>
            {org.max_users ?? "—"}
          </p>
          <p>
            <span className="font-bold">Company Size:</span>{" "}
            {org.company_size ?? "—"}
          </p>

          <p>
            <span className="font-bold">Created:</span>{" "}
            {new Date(org.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default OrganizationDetails;
