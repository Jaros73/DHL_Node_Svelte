import { StatusCodes } from "http-status-codes";
import { ESB_URL } from "../config";
import { esbRequest } from "../esb/esb-request";

const POST_OFFICE_DEPO = "9";
const POST_OFFICE_DSPU = "15";

const ALLOWED_POST_OFFICE_TYPES = [POST_OFFICE_DEPO, POST_OFFICE_DSPU];

interface PostDetail {
  postId: string;
  postCode: string;
  name: string;
  region: string;
  region1: string;
  spuName?: string;
  postOfficeType: string;
  postOfficeTypeName: string;
  email?: string;
}

type PostDetailResponse = { attributes: PostDetail }[];

export async function postInfoGetDetail() {
  let res = await esbRequest(`${ESB_URL}/postinfoservice/api/v1/postdetail`);
  if (res.statusCode !== StatusCodes.OK) {
    throw new Error(`Received non-OK status: ${res.statusCode}`);
  }

  let body = JSON.parse(res.body) as PostDetailResponse;
  return body
    .filter((it) => ALLOWED_POST_OFFICE_TYPES.includes(it.attributes.postOfficeType))
    .map((it) => it.attributes);
}
