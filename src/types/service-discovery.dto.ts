import { z } from 'zod';

export interface GetServiceDTO {
  service_name: string;
}

export const GetServiceDTOSchema = z.object({
  service_name: z.string({
    required_error: "service_name is required",
    invalid_type_error: "service_name must be a string"
  }).min(1, "service_name cannot be empty"),
});

export interface ServiceDTO {
  service_name: string;
  host: string;
  port: number;
  health_check_url?: string;
}

export const ServiceDTOSchema = z.object({
  service_name: z.string({
    required_error: "service_name is required",
    invalid_type_error: "service_name must be a string"
  }).min(1, "service_name cannot be empty"),

  host: z.string({
    required_error: "host is required",
    invalid_type_error: "host must be a string"
  }).min(1, "host cannot be empty"),

  port: z.number({
    required_error: "port is required",
    invalid_type_error: "port must be a number",
  }).int("port must be an integer").min(1, "port must be greater than 0"),

  health_check_url: z.string({
    invalid_type_error: "health_check_url must be a string"
  }).optional().refine(val => val === undefined || val.trim() !== '', {
    message: "health_check_url cannot be empty",
  }),
});

export interface DeregisterServiceDTO {
  service_name: string;
}

export const DeregisterServiceDTOSchema = z.object({
  service_name: z.string({
    required_error: "service_name is required",
    invalid_type_error: "service_name must be a string"
  }).min(1, "service_name cannot be empty"),
});
