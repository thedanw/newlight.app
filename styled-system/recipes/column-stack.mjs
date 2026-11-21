import { memo, splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const columnStackFn = /* @__PURE__ */ createRecipe('column-stack', {
  "spacing": "md",
  "align": "stretch",
  "layout": "stack"
}, [
  {
    "grow": true,
    "justify": "between",
    "css": {
      "& > *:first-child": {
        "marginTop": "auto"
      },
      "& > *:last-child": {
        "marginBottom": "auto"
      }
    }
  },
  {
    "layout": "2",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *": {
        "flex": "1 1 0%",
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "3",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *": {
        "flex": "1 1 0%",
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "4",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *": {
        "flex": "1 1 0%",
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "1-4-1",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "1 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "4 1 0%"
      },
      "& > *:nth-child(3)": {
        "flex": "1 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "1-3-1",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "1 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "3 1 0%"
      },
      "& > *:nth-child(3)": {
        "flex": "1 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "1-2",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "1 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "2 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "2-1",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "2 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "1 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "1-3",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "1 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "3 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "3-1",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "3 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "1 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "2-3",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "2 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "3 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "3-2",
    "css": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "& > *:nth-child(1)": {
        "flex": "3 1 0%"
      },
      "& > *:nth-child(2)": {
        "flex": "2 1 0%"
      },
      "& > *": {
        "minWidth": "0"
      }
    }
  },
  {
    "layout": "2",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "4",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "4",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "4",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-4-1",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-4-1",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-4-1",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3-1",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3-1",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3-1",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-2",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-2",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-2",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-1",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-1",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-1",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "1-3",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-1",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-1",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-1",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-3",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-3",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "2-3",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-2",
    "stack": "sm",
    "css": {
      "@media (max-width: 640px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-2",
    "stack": "md",
    "css": {
      "@media (max-width: 768px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  },
  {
    "layout": "3-2",
    "stack": "lg",
    "css": {
      "@media (max-width: 1024px)": {
        "flexDirection": "column",
        "& > *": {
          "width": "full",
          "flex": "none"
        }
      }
    }
  }
])

const columnStackVariantMap = {
  "spacing": [
    "none",
    "xs",
    "sm",
    "md",
    "lg",
    "xl"
  ],
  "align": [
    "start",
    "center",
    "end",
    "stretch",
    "baseline"
  ],
  "justify": [
    "start",
    "center",
    "end",
    "between",
    "around",
    "evenly"
  ],
  "grow": [
    "true"
  ],
  "divider": [
    "true"
  ],
  "layout": [
    "2",
    "3",
    "4",
    "stack",
    "1-4-1",
    "1-3-1",
    "1-2",
    "2-1",
    "1-3",
    "3-1",
    "2-3",
    "3-2"
  ],
  "stack": [
    "sm",
    "md",
    "lg"
  ]
}

const columnStackVariantKeys = Object.keys(columnStackVariantMap)

export const columnStack = /* @__PURE__ */ Object.assign(memo(columnStackFn.recipeFn), {
  __recipe__: true,
  __name__: 'columnStack',
  __getCompoundVariantCss__: columnStackFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: columnStackVariantKeys,
  variantMap: columnStackVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, columnStackVariantKeys)
  },
  getVariantProps: columnStackFn.getVariantProps,
})