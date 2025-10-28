import { cn } from "@/lib/utils";

export const SocialBar = ({ className }: { className?: string }) => {
  return (
    <ul
      className={cn(
        "flex flex-row gap-3 items-center justify-center",
        className
      )}
    >
      <li>
        <a
          href="https://mastodon.social/@mom_inst@social.moment.at"
          target="_blank"
        >
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-mastodon-black.svg"
            alt="mastodon"
          />
        </a>
      </li>
      <li>
        <a href="https://x.com/mom_inst" target="_blank">
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-x-black.svg"
            alt="x"
          />
        </a>
      </li>
      <li>
        <a href="https://www.instagram.com/moment_magazin/" target="_blank">
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-instagram-black.svg"
            alt="instagram"
          />
        </a>
      </li>
      <li>
        <a href="https://www.facebook.com/momentuminstitut" target="_blank">
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-facebook-black.svg"
            alt="facebook"
          />
        </a>
      </li>
      <li>
        <a
          href="https://at.linkedin.com/company/momentum-institut"
          target="_blank"
        >
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-linkedin-black.svg"
            alt="linkedin"
          />
        </a>
      </li>
      <li>
        <a href="https://www.threads.net/@moment_magazin?hl=de" target="_blank">
          <img
            width="24"
            height="24"
            src="https://www.momentum-institut.at/wp-content/themes/moi/assets/img/icons/footer-threads-black.svg"
            alt="threads"
          />
        </a>
      </li>
    </ul>
  );
};
