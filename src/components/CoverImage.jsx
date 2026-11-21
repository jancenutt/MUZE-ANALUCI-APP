import { Image } from "@/components/ui/image";

// The source covers still carry the distributor's footer text. A slight zoom anchored to the
// top pushes that strip out of frame until the clean originals are uploaded.
export default function CoverImage({ src, alt, className = "", ...rest }) {
  return (
    <Image
      src={src}
      alt={alt}
      fittingType="fill"
      loading="lazy"
      className={`h-full w-full origin-top scale-[1.16] object-cover ${className}`}
      {...rest}
    />
  );
}