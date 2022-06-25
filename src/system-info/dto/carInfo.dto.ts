export class addCarDto {
  status: addCarStatusEnum;
  data: {
    description: string;
    carInfo: {
      vehicleCode: string;
      vehicleColor: string;
      VINNum: string;
      b64vin: string;
    };
  };
}

export enum addCarStatusEnum {
  SUCESS = 0,
  FAIL = 1,
}
