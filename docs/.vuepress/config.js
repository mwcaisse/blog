
module.exports = {
    title: "Code Untamed",
    theme: "@vuepress/theme-blog",
    themeConfig: {
        dateFormat: "YYYY-MM-DD",
        footer: {
            contact: [
                {
                    type: "github",
                    link: "https://github.com/mwcaisse"
                }
            ],
            copyright: [
                {
                    text: "© 2022 Mitchell Caisse"
                }
            ]
        },
        nav: [
            {
                text: "Posts",
                link: "/"
            },
            {
                text: "Tags",
                link: "/tag/"
            }
        ]
    },
    plugins: [
        [
            "@vuepress/blog",
            {
                directories: [
                    {
                        id: "post",
                        dirname: "_posts",
                        path: "/",
                        pagination: {
                            lengthPerPage: 10,
                        }
                    }
                ],
                frontmatters: [
                    {
                        id: "tag",
                        keys: ["tag", "tags"],
                        path: "/tag/",
                    }
                ],
                sitemap: {
                    hostname: "https://codeuntamed.com"
                }

            }
        ],
        [
        "@vuepress/google-analytics",
            {
                ga: "UA-163414755-1"
            }
        ]
    ]
}
