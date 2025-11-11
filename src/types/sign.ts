export type LoginReqType = {
  email: string;
  password: string;
};

export type LoginResType = {
  token: string;
};

export type SignupReqType = {
  email: string;
  name: string;
  password: string;
};

export type SignupResType = {
  token: string;
};
