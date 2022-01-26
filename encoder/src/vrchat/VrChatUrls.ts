let vrChatUrls = {
  base: "https://api.vrchat.cloud/api/1",

  checkAuth: "/auth",
  config: "/config",

  login: (apiKey: string): string => {
    return `/auth/user?apiKey=${apiKey}`;
  },
  avatar: (avatarId: string): string => {
    return `/avatars/${avatarId}`;
  },

  file: (fileId: string): string => {
    return `/file/${fileId}`;
  },
  fileVersion: (fileId: string, versionId: string): string => {
    return `/file/${fileId}/${versionId}`;
  },
  fileVersionFile: (fileId: string, versionId: string): string => {
    return `/file/${fileId}/${versionId}/file`;
  },

  startFileUpload: (fileId: string, versionId: string): string => {
    return `/file/${fileId}/${versionId}/file/start`;
  },
  finishFileUpload: (fileId: string, versionId: string): string => {
    return `/file/${fileId}/${versionId}/file/finish`;
  },
  finishSignatureUpload: (fileId: string, versionId: string): string => {
    return `/file/${fileId}/${versionId}/signature/finish`;
  }

};

export default vrChatUrls;