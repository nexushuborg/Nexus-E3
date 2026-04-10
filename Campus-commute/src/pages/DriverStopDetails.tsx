import MobileLayout from "@/components/MobileLayout";
import BackButton from "@/components/BackButton";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteContext } from "@/contexts/RouteContext";
import { Clock } from "lucide-react";

const DriverStopDetails = () => {
  const { user } = useAuth();
  const { routes } = useRouteContext();

  // Find the route assigned to the driver during signup
  // user.routeNo typically holds the busNumber from the dropdown
  const myRoute = routes.find(
    (r) => r.busNumber === user?.routeNo || r.routeName === user?.routeNo
  ) || routes[0]; // fallback so it never shows empty

  const stoppages = myRoute?.stoppages || [];

  return (
    <MobileLayout>
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">
          <BackButton to="/driver-home" />

          <div className="flex-1 pt-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2">
              Stop Details
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              {myRoute?.routeName || "Assigned Route"}
            </p>

            <div className="space-y-0 relative">
              {stoppages.length > 0 ? (
                stoppages.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === stoppages.length - 1;
                  const time = stop.arrivalTime || "TBD";

                  return (
                    <div key={`${stop.name}-${index}`} className="flex items-start gap-4 h-full relative">
                      
                      {/* Timeline Node Column */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${
                          isFirst ? 'bg-green-500 border-green-600' : 
                          isLast ? 'bg-red-500 border-red-600' : 'bg-primary border-primary'
                        }`} />
                        
                        {/* Only draw line if not the very last node */}
                        {!isLast && (
                          <div className="w-0.5 h-16 bg-primary/30 my-1" />
                        )}
                      </div>
                      
                      {/* Card Data Column */}
                      <div className="flex-1 bg-muted rounded-2xl p-4 mb-2 shadow-sm border border-border">
                        <div className="flex justify-between items-center">
                          <h3 className={`font-medium ${isFirst || isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {stop.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={`font-medium ${time !== 'TBD' ? 'text-primary' : ''}`}>
                            {time}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-6 text-muted-foreground bg-muted rounded-2xl text-sm">
                  No stoppages assigned to your route yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default DriverStopDetails;
