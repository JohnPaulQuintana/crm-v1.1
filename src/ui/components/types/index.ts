export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

export interface DashboardProps {
  user: User;
  setUser: (u: User | null) => void;
}

export interface CrendentialInfo {
  visible: boolean;
  username: string;
  password: string;
}

export interface VpnInfo {
  title: string;
  text: string;
}

export interface Description {
  columns: string[];
  description: string;
}

export interface SqlSegment {
  text: string;
  editable?: boolean;
  value?: string;
  label: string;
}

export interface SqlFile {
  name: string;
  content: string;
  parsedSegments: SqlSegment[];
}

export interface TabConfig {
  [key: string]: {
    label: string;
    icon: React.ReactNode;
  };
}