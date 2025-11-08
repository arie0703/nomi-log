import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import styled from "@emotion/styled";

const CircularInternalContent = styled.div`
  left: 0;
  top: 16px;
  bottom: 0;
  right: 0;
  position: absolute;
`;

const IntakeSuffix = styled(Typography)`
  margin-bottom: 4px;
`;

const StyledCircularBackground = styled(CircularProgress)`
  color: #bfbfbf;
`;

const StyledCircularBar = styled(CircularProgress)`
  position: absolute;
  color: #ff69b4;
`;

interface AlcoholGaugeProps {
  /** アルコール摂取量(ml) */
  intake: number;
  /** 最大値(ml)。デフォルトは20ml */
  max?: number;
}

export default function AlcoholGauge({ intake, max = 20 }: AlcoholGaugeProps) {
  // ゲージの充填率を計算（最大値を超える場合は100%）
  const fillPercentage = Math.min((intake / max) * 100, 100);

  return (
    <Box position="relative" display="inline-flex">
      {/* 背景用のCircularProgress */}
      <StyledCircularBackground variant="determinate" size={96} value={100} />
      {/* バロメーター用のCircularProgress */}
      <StyledCircularBar
        variant="determinate"
        size={96}
        value={fillPercentage}
      />
      <CircularInternalContent>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
        >
          <LocalBarIcon fontSize="large" sx={{ color: "#ff69b4" }} />
          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="flex-end"
          >
            <Typography variant="h6">{intake.toFixed(1)}</Typography>
            <IntakeSuffix variant="caption">ml</IntakeSuffix>
          </Grid>
        </Grid>
      </CircularInternalContent>
    </Box>
  );
}
