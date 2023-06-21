import { Checkbox } from '~/components/ui/Checkbox';
import { Label } from '~/components/ui/Label';

const Disabled = () => {
  return (
    <div className='space-y-2'>
      <div className='flex items-center space-x-2'>
        <Checkbox disabled id='terms' />
        <Label htmlFor='terms'>Accept terms and conditions</Label>
      </div>

      <div className='flex items-center space-x-2'>
        <Checkbox disabled id='terms' shape='rounded' />
        <Label htmlFor='terms'>Accept terms and conditions</Label>
      </div>
    </div>
  );
};

export default Disabled;
