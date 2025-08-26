// utils/errorHandlers.ts
import type { VpnInfo } from '../types';

export interface ExecutionResult {
  success: boolean;
  type?: string;
  error?: string;
  data?: any;
}

export const handleExecutionError = (result: ExecutionResult): { vpnInfo: VpnInfo; showVpn: boolean } => {
  if (result.type === "vpn_error") {
    return {
      vpnInfo: {
        title: "VPN Required",
        text: "To access this service, please connect to a VPN and try again.",
      },
      showVpn: true
    };
  }

  if (result.type === "auth_error" || result.type === "invalid_credentials") {
    return {
      vpnInfo: {
        title: "Credential Error",
        text: "Your username or password is incorrect. Please check and try again.",
      },
      showVpn: true
    };
  }

  if (result.type === "credentials_required") {
    return {
      vpnInfo: {
        title: "Credential Error",
        text: "Your username or password is required. Please check and try again.",
      },
      showVpn: true
    };
  }

  if (result.type === "sql_error") {
    return {
      vpnInfo: {
        title: "Permission Error",
        text: result.error || "Something went wrong. Please try again later.",
      },
      showVpn: true
    };
  }

  // Default error
  return {
    vpnInfo: {
      title: "Unexpected Error",
      text: result.error || "Something went wrong. Please try again later.",
    },
    showVpn: true
  };
};