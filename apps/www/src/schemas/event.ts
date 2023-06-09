import { z } from 'zod';

const event = z.object({
  name: z.enum([
    'copy_npm_command',
    'copy_usage_import_code',
    'copy_usage_code',
    'copy_primitive_code',
  ]),
  // declare type AllowedPropertyValues = string | number | boolean | null
  properties: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export default event;
